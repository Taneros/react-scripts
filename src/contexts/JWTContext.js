import { createContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
// utils
import axios from '../utils/axios';
import { setSession } from '../utils/jwt';
// import { createInstance } from 'i18next';

// ----------------------------------------------------------------------

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

let wbSync;

const handlers = {
  INITIALIZE: (state, action) => {
    const { isAuthenticated, user } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  },
  LOGIN: (state, action) => {
    const { user } = action.payload;
  

    return {
      ...state,
      isAuthenticated: true,
      user,
    };
  },
  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
  }),
  REGISTER: (state, action) => {
    const { user } = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      isInitialized: true,
      user,
    };
  },
};

const reducer = (state, action) => (handlers[action.type] ? handlers[action.type](state, action) : state);

const AuthContext = createContext({
  ...initialState,
  method: 'jwt',
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  register: () => Promise.resolve(),
  initialize: () => Promise.resolve(),

});

// ----------------------------------------------------------------------

AuthProvider.propTypes = {
  children: PropTypes.node,
};

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = async () => {
    try {
      const accessToken = window.localStorage.getItem('accessToken');


      if (accessToken !== null) {
        setSession(accessToken);

        if(!wbSync)
          await syncWB(localStorage.getItem('login'), localStorage.getItem('accessToken'));
        wbSync = true;

        const response = await axios.get('https://ideav.online/api/magnet/report/66177?JSON_KV',
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Authorization': localStorage.getItem('accessToken'),
          }
        });

        const user = response.data[0];
        console.log("User", user.error)
        if (user.error){
          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }else{
          dispatch({
            type: 'INITIALIZE',
            payload: {
              isAuthenticated: true,
              user
            },
          });
        }
        

      } else {
        dispatch({
          type: 'INITIALIZE',
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    } catch (err) {
      console.error(err);
      dispatch({
        type: 'INITIALIZE',
        payload: {
          isAuthenticated: false,
          user: null,
        },
      });
    }
  };

  useEffect(() => {
    
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncWB = async (login, accessToken) => {
    await doSyncWB(login, accessToken, 'stocks');
    await doSyncWB(login, accessToken, 'orderdel');
    await doSyncWB(login, accessToken, 'order');
    await doSyncWB(login, accessToken, 'saledel');
    await doSyncWB(login, accessToken, 'sale');
    await doSyncWB(login, accessToken, 'incomedel');
    await doSyncWB(login, accessToken, 'income');
    preCalc(accessToken);
  }

  const doSyncWB = async (login, accessToken, table) => {
    const res = await axios.post("https://magnetx.ideav.online/wb.php",
      {'table':table,
      'user':login,
      'token':accessToken});
    if(res.data.indexOf('Updated Ok')!==-1){
      console.log(`Some updates came: ${res.data}`);
    }
    else if(res.data.indexOf('No updates needed')!==-1){
      console.log('No updates needed');
    }
    else
      console.log(res.data);
  }
  
  const preCalc = async (accessToken) => {
    let preCalcRes;
    let preCalcs;
    /* eslint-disable no-await-in-loop */
    do{
      preCalcRes = await axios.post('https://ideav.online/api/magnet/report/18225012/?confirmed=1', {
        _xsrf:localStorage.getItem("xsrf")
      },{headers:{'X-Authorization':accessToken}});
  
      if(!preCalcRes.data.columns){
        // throw  new Error("Ошибка пересчета");
        console.log("Ошибка пересчета");
        return;
      }
      if(preCalcRes.data.data[4].length > 0)
        preCalcs = true;
    } while(preCalcRes.data.data[4].length > 0);
    /* eslint-disable no-await-in-loop */
    if(preCalcs){
      alert("Данные обновились, страница будет перезагружена");
      document.location.reload();
    }
  }
  const login = async (login, password) => {
    const response = await axios.post("https://ideav.online/api/magnet/auth", {
      'login': login,
      'pwd': password
    },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      })

    if (response.data.length===1) {
      setSession(null);
      throw new Error(response.data[0].error);
    } else {
      localStorage.setItem("login", login)
      const xsrfToken = response.data._xsrf;
      const accessToken = response.data.token;
      const user = response.data.id;
      setSession(accessToken);
      localStorage.setItem("xsrf",xsrfToken);
      await syncWB(login, accessToken);
      dispatch({
        type: 'LOGIN',
        payload: {
          user,
        },
      });
    }

  };

  const register = async (t33, t66078, t66076, t18, t30, t20, t40, t125) => {
    const accessToken = 'xx';
    const _xsrf = 'xx';

    const registerTokenID = await axios.post('https://ideav.online/api/magnet/_m_new/13673973?up=1', {
      t13673973:t66076,
      _xsrf
    },{headers:{'X-Authorization':accessToken}});

    if(!registerTokenID.data.id){
      throw  new Error("Ошибка создания токена");
    }

    const t156 = new Date().getDate();
    const t115=164;
    const response = await axios.post('https://ideav.online/api/magnet/_m_new/18?up=1', {
      t33,
      t30,
      t66078,
      t66076:registerTokenID.data.id,
      t18,
      t20,
      t40,
      t125,
      t115,
      t156,
      _xsrf
    },{headers:{'X-Authorization':accessToken}});


    if(response.data.warning){
      throw  new Error("Имя пользователя уже занято");
    }
    //    const { accessToken, user } = response.data;
    localStorage.setItem("login", t18)
    const user = t18;
    console.log(user)
    setSession(t40);
    //    window.localStorage.setItem('accessToken', accessToken);
    dispatch({
      type: 'REGISTER',
      payload: {
        user,
      },
    });
    await axios.post('https://ideav.online/api/magnet/report/14320949', {
      FR_WBkey:registerTokenID,
      confirmed:1,
      _xsrf
    },{headers:{'X-Authorization':accessToken}});

    if(!registerTokenID.data.id){
      throw  new Error("Ошибка присвоения токена");
    }
  };

  const logout = async () => {
    setSession(null);
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'jwt',
        login,
        logout,
        register,
        initialize,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
