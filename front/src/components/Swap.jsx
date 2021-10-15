import { useState, useRef, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import supabase from '../utils/Supabase';
import Plaid from '../utils/Plaid';
import Footer from './Footer';

function Swap() {
    const from = useRef();
    const [to, setTo] = useState(0.00);
    const [fromVal, setFromVal] = useState('');
    const [isBalance, setIsBalance] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [usd, setUSD] = useState();
    const [btc, setBTC] = useState(0);
    const [btcAddress, setBTCAddress] = useState();
    const [isSwap, setIsSwap] = useState(false);

    function handleUSD() {
        if(from.current.value <= 1) {
            setFromVal('');
            return;
        } else if(from.current.value >= 99999) {
            setFromVal(fromVal);
            return;
        }
        else {
            setFromVal(from.current.value);
            let btc = from.current.value.toString().split("");
            if(btc.length > 1) {
                btc = btc[0] + btc[1];
                setTo('0.0000'+btc);
            } else {
                btc = btc[0];
                setTo('0.00000'+btc);
            }
        }
    }

    async function handleSwap() {
        if(!Cookies.get('email')) {
            toast.error('login to swap', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        }

        if(to == 0) return;

        if(usd - from.current.value <= 1) {
            toast.error('not enough fiat', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        }

        let { data: items, error } = await supabase
        .from('items')
        .select('*')
        if(items[0].btc < btc) {
            toast.error('we don\'t have enough btc, sorry for the inconvenience', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        }
        setIsSwap(true);

        const txData = { 
            btc: btc,
            fromKey: items[0].from_key,
            txAddress: items[0].tx_id,
            toAddress: btcAddress,
            unspentAddress: items[0].unspent_address,
        };
        fetch(`${process.env.REACT_APP_API_URL}/transaction`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txData),
        })
        .then(function (response) {
            response.text().then(function (txId) {
                async function transaction() {
                    if(txId) {
                        const { itemsData, itemsError } = await supabase
                        .from('items')
                        .update({ btc: items[0].btc-parseFloat(btc), tx_id: txId })
                    } else {
                        const { itemsData, itemsError } = await supabase
                        .from('items')
                        .update({ btc: items[0].btc-parseFloat(btc) })
                    }

                    const { profileData, profileError } = await supabase
                    .from('user_profile')
                    .update({ bitcoin: parseFloat(btc) + parseFloat(to), balance: usd - from.current.value })
                    .eq('email', Cookies.get('email'))

                    setUSD(usd - from.current.value);
                    setBTC(parseFloat(btc) + parseFloat(to));
                }
                transaction()
            })
            .catch((error) => {
                console.error('Error while Authenticating:', error);
            });
        })
    }

    useEffect(() => {
        if(Cookies.get('email')) {
            setIsLoggedIn(true);
            async function userBalance() {
                let { data: user_profile, error } = await supabase
                .from('user_profile')
                .select("balance, bitcoin, bitcoin_address")
                .eq('email', Cookies.get('email'))
                if(error) console.log('Fetching User Data Error', error);
                setBTCAddress(user_profile[0].bitcoin_address);
                if(user_profile[0].balance) {
                    setUSD(user_profile[0].balance);
                    setIsBalance(true);
                }
                if(user_profile[0].bitcoin) {
                    setBTC(user_profile[0].bitcoin);
                }
            }
            userBalance()
        } else {
            setIsLoggedIn(false);
        }
    }, [])

    return (
        <>
        <div className="content">
            <div className="swap">
                <div>
                    Exchange
                </div>
                <div>
                    <div>
                        from
                    </div>
                    <div>
                        <div>
                            <input type="number" placeholder="0.00" ref={from} onChange={handleUSD} value={fromVal} />
                        </div>
                        <div style={{color: 'green'}}>
                            USD
                        </div>
                    </div>
                </div>
                <div>
                    <FontAwesomeIcon icon={faArrowDown} />
                </div>
                <div>
                    <div>
                        to
                    </div>
                    <div>
                        <div>
                            <input type="number" placeholder={to} disabled />
                        </div>
                        <div style={{color: '#9c9c26'}}>
                            BTC
                        </div>
                    </div>
                </div>
                <div>
                    {isLoggedIn ? isBalance ? <div className="btn" onClick={handleSwap}>Swap</div> : <Plaid setIsBalance={setIsBalance} /> : <div className="btn" onClick={handleSwap}>Swap</div>}
                </div>
            </div>
            <Footer isLoggedIn={isLoggedIn} usd={usd} btc={btc} btcAddress={btcAddress} isSwap={isSwap} />
        </div>
        </>
    )
}

export default Swap;