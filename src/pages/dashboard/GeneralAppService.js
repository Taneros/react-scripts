
import useFetchHook from "../../hooks/useFetchHook";
import { Router, useNavigate } from "react-router";

const UseTableDataService = () => {

    const {getRequest, postRequest, error, clearError} = useFetchHook();

    const _baseUrl = "https://ideav.online/api/magnet";

    const getData = async () =>{
        const res = await getRequest(`${_baseUrl}report/42928`);
        console.log("res");
        console.log(res);
        if(res.data[0].error)
            document.location.href='/';
        return res;
    }


    const Authorise = async () => {
        const res = await postRequest(`${_baseUrl}/auth`, { "login": "guest", "pwd": "magnetx" }, 
            { headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            } })
            return res
    }

    
    return {getData, Authorise, error, clearError};
};

export default UseTableDataService;