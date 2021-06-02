import axios from 'axios';
import { API_URL } from '@/config/env';
import router from '@/router';
import { clearUser, getUser } from '@/store/modules/auth/user';

const axiosInstance = axios.create({
  baseURL: API_URL
})

const user = getUser();

if (user && user.token) {
  axiosInstance.defaults.headers.common['x-auth'] = user.token;
}

axiosInstance.interceptors.response.use(undefined, function (err) {
  return new Promise(function () {
    if (err && 
        err.response && 
        err.response.status === 401 && 
        err.config && 
        !err.config.__isRetryRequest
    ) {
      clearUser();
      router.push('/');
    }
    throw err;
  });
});

export default axiosInstance;