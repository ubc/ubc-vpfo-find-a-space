import axios, {isCancel, AxiosError} from 'axios';

axios.defaults.baseURL = (window as any).find_a_space_script_vars.ajax_url;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

function ajaxPost(action, payload) {
  return axios.post('', {
    action: action,
    data  : payload,
    _nonce: (window as any).find_a_space_script_vars._nonce,
  });
}

export function getMeta(payload) {
  return ajaxPost('find_a_space_meta', payload);
}

export function getBuildings(payload) {
  return ajaxPost('find_a_space_buildings', payload);
}

export function getRooms(payload) {
  return ajaxPost('find_a_space_rooms', payload);
}