import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import Cookies from 'js-cookie';
import supabase from '../utils/Supabase';

const Plaid = ({setIsBalance}) => {
    const [linkToken, setLinkToken] = useState(null);
    useEffect(() => {
        let controller = new AbortController();
        const generateToken = async () => {
            let { data: user_profile, error } = await supabase
            .from('user_profile')
            .select("id")
            .eq('email', Cookies.get('email'))
            try {
                const userData = { uid: user_profile[0].id };
                const response = await fetch(`${process.env.REACT_APP_API_URL}/create_link_token`, {
                    method: 'POST',
                    mode: 'cors',
                    signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });
                const data = await response.json();
                setLinkToken(data.link_token);
            } catch(error) {
                console.log("Plaid request switched");
            }
            
        };
        generateToken();
        return () => {
            controller.abort();
        }
    }, []);
    return linkToken != null ? <Link linkToken={linkToken} setIsBalance={setIsBalance} /> : <></>;
};

const Link = ({linkToken, setIsBalance}) => {
    const onSuccess = React.useCallback((public_token, metadata) => {
        const response = fetch(`${process.env.REACT_APP_API_URL}/set_access_token`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token }),
        })
        .then(function (response) {
            response.json().then(function (data) {
                Cookies.set('access_token', data.access_token, { expires: 2 });
                getBalance()
            })
            .catch((error) => {
                console.error('Error while setting access token:', error);
            });
        })

        async function getBalance() {
            const balanceResponse = await fetch(`${process.env.REACT_APP_API_URL}/balance`, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: Cookies.get('access_token') }),
            })

            let totalBalance = 0;
            const balance = await balanceResponse.json();
            if(balance) {
                Cookies.remove('access_token');
            }

            for(let b = 0; b < balance.accounts.length; b++) {
                totalBalance += balance.accounts[b].balances.available;
            }

            const { data, error } = await supabase
            .from('user_profile')
            .update({ balance: totalBalance })
            .eq('email', Cookies.get('email'))
            setIsBalance(true);
            window.location.reload();
        }
    }, []);
    const config = {
        token: linkToken,
        onSuccess,
    };
    const { open, ready } = usePlaidLink(config);
    return (
        <button onClick={() => open()} disabled={!ready} className="btn" >
            Link account
        </button>
    );
};

export default Plaid;