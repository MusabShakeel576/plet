import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import MicroModal from 'micromodal';
import toast, { Toaster } from 'react-hot-toast';
import supabase from '../utils/Supabase';

function Header() {
    const email = useRef();
    const pwd = useRef();
    const name = useRef();
    const profession = useRef();
    const [isAuth, setIsAuth] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const emailRegex = /\S+@\S+\.\S+/;

    function handleModal() {
        MicroModal.show('modal-user');
    }

    async function handleLogin() {
        const emailVal = email.current.value;
        const pwdVal = pwd.current.value;
        if (!emailRegex.test(emailVal)) {
            toast.error('email is not valid', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        }

        if (pwdVal.length <= 5) {
            toast.error('password is too small', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        }

        let { data: user_profile, error } = await supabase
        .from('user_profile')
        .select("pwd")
        .eq('email', emailVal)
        if(error) console.log('Fetching User Data Error', error);

        if(user_profile.length === 0) {
            fetch(`${process.env.REACT_APP_API_URL}/wallet`, {
                method: 'POST',
                mode: 'cors',
            })
            .then(function (response) {
                response.json().then(function (res) {
                    async function user() {
                        const { data, error } = await supabase
                        .from('user_profile')
                        .insert([
                            { email: emailVal, pwd: pwdVal, bitcoin_address: res.btcAddress, private_key: res.privateKey, mnemonic: res.mnemonic },
                        ])
                        setIsAuth(true);
                        localStorage.setItem("email", emailVal);
                        toast.success('successfully authenticated', {
                            iconTheme: {
                                primary: '#fff',
                                secondary: '#000',
                            },
                        });
                        return;
                    }
                    user();
                })
                .catch((error) => {
                    console.error('Error while creating wallet:', error);
                });
            })
        } else if(user_profile[0].pwd != pwdVal) {
            toast.error('combination is not valid', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        } else {
            Cookies.set('email', emailVal, { expires: 28 });
            setIsLoggedIn(true);
            toast.success('successfully authenticated', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            MicroModal.close('modal-user');
            window.location.reload();
            return;
        }
    }

    async function handlePersonal() {
        const nameVal = name.current.value;
        const professionVal = profession.current.value;

        if (nameVal.length <= 2) {
            toast.error('name is not valid', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        }

        if (professionVal.length <= 2) {
            toast.error('profession is not valid', {
                iconTheme: {
                    primary: '#fff',
                    secondary: '#000',
                },
            });
            return;
        }

        const { data, error } = await supabase
        .from('user_profile')
        .update({ username: nameVal, profession: professionVal })
        .eq('email', localStorage.getItem("email"))
        Cookies.set('email', localStorage.getItem("email"), { expires: 28 });
        localStorage.removeItem("email");

        MicroModal.close('modal-user');
        window.location.reload();
    }

    function handleLogout() {
        Cookies.remove('email');
        setIsLoggedIn(false);
        window.location.reload();
    }

    useEffect(() => {
        try {
            MicroModal.init({
                awaitCloseAnimation: true,
                onShow: function (modal) {
                    console.log("micromodal open");
                },
                onClose: function (modal) {
                    console.log("micromodal close");
                }
            });
        } catch (e) {
            console.log("micromodal error: ", e);
        }
        
        if(isAuth) {
            name.current.value = "";
            profession.current.value = "";
        }

        if(Cookies.get('email')) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, [isAuth])

    return (
        <>
            <Toaster position="top-right" reverseOrder={false}
                toastOptions={{
                    success: {
                        style: {
                            background: 'green',
                            color: 'white',
                        },
                    },
                    error: {
                        style: {
                            background: 'red',
                            color: 'white',
                        },
                    },
                }}
            />

            <div className="modal micromodal-slide" id="modal-user" aria-hidden="true">
                <div className="modal__overlay" tabIndex="-1" data-micromodal-close>
                    <div className="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-user-title">
                        <header className="modal__header">
                            <h2 className="modal__title">
                                Plet Account
                            </h2>
                            <button className="modal__close" aria-label="Close modal" data-micromodal-close></button>
                        </header>
                        <div className="modal-content-content">
                            {isAuth ? 
                                <form>
                                    <div className="modal__content">
                                        <input type="text" placeholder="Enter your name" className="input" ref={name} />
                                        <input type="text" placeholder="Enter your profession" className="input" ref={profession} />
                                    </div>
                                </form> :
                                <form>
                                    <div className="modal__content">
                                        <input type="email" placeholder="Enter your email address" className="input" ref={email} autoComplete="username" />
                                        <input type="password" placeholder="Enter your password" className="input" ref={pwd} autoComplete="current-password" />
                                    </div>
                                </form>
                            }
                            <footer className="modal__footer">
                                <button className="modal__btn" onClick={isAuth ? handlePersonal : handleLogin }>Continue</button>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="header">
                <div>
                    <div>Plet</div>
                    <div>bitcoin pocket wallet</div>
                </div>
                <div>
                    <div className="btn" onClick={isLoggedIn ? handleLogout : handleModal}>{isLoggedIn ? 'Logout' : 'Get Started'}</div>
                </div>
            </div>
        </>
    )
}

export default Header;