import {getUser} from '@/store/modules/auth/user';

export default function auth({ next, to }) {
  const user = getUser();

  if (!user || !user.token) {
    return next('/login');
  }

  if (to.meta.type) {
    var type = user.type;
    
    if (type == 'super_admin') {
      return next();
    }

    if (type !== to.meta.type) {
      return next('/login');
    }
  }

  return next();
}