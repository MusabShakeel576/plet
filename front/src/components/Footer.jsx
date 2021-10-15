import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faBitcoin } from '@fortawesome/free-brands-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';

function Footer({isLoggedIn, usd, btc, isSwap, btcAddress}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    async function handleWalletToggle() {
        setIsOpen(!isOpen);
    }

    function handleCopy() {
        navigator.clipboard
        .writeText(btcAddress)
        .catch((err) => {
            console.log("Something went wrong while copying address", err);
        });
        setIsCopied(true);
    }

    useEffect(() => {
        if(isSwap) {
            let x = document.querySelector('#btc-sound');
            x.play();
        }
    }, [isSwap])

    return (
        <>
        <div className="footer">
            <div className="tooltip">

                {isSwap ?  <>
                <FontAwesomeIcon icon={faBitcoin} className="bitcoin-icon" />
                <audio id="btc-sound">
                    <source src="/assets/btc-sound.mp3" type="audio/mpeg" />
                </audio> </>
                : null}
                
                <FontAwesomeIcon icon={isOpen ? faTimes : faWallet} className="wallet-icon" onClick={handleWalletToggle} />
                <div className="top" style={{ display: isOpen ? 'block' : 'none' }}>
                    {isLoggedIn ? <>
                    <a href={`https://live.blockcypher.com/btc-testnet/address/${btcAddress}`} target="_blank" rel="noreferrer">
                        <p style={{textAlign: 'center'}}>See all transactions</p>
                    </a>
                    <h3>BTC Address:</h3>
                    <p onClick={handleCopy}>{btcAddress ? <>{btcAddress.split("").slice(0, 5)} <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} style={{cursor: isCopied ? 'auto' : 'pointer'}} /> </>:
                    'no address'}</p>
                    <h3>USD Balance:</h3>
                    <p>{usd ? usd : 0}</p>
                    <h3>BTC Balance:</h3>
                    <p>{btc ? btc : 0}</p></>
                    : 'Login to see the fabric'}
                    <i></i>
                </div>
            </div>
        </div>
        </>
    )
}

export default Footer;