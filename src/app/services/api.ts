import axios, {isCancel, AxiosError} from 'axios';

axios.defaults.baseURL = (window as any).find_a_space_script_vars.ajax_url;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

let currentNonce = (window as any).find_a_space_script_vars._nonce;

async function refreshNonce() {
  const res = await axios.post('', { action: 'find_a_space_get_nonce' });
  currentNonce = res?.data?.nonce;
  return currentNonce;
}

async function ajaxPost(action, payload, isRetry = false) {
  const res = await axios.post('', {
    action: action,
    data  : payload,
    _nonce: currentNonce,
  });

  // The nonce embedded in the page can go stale on long-lived or cached
  // pages. Refresh it and retry once before giving up.
  if ( res?.data?.success === false && res?.data?.data === 'Invalid nonce' && ! isRetry ) {
    await refreshNonce();
    return ajaxPost(action, payload, true);
  }

  return res;
}

export function getClassroom(payload) {
  return ajaxPost('find_a_space_classroom', payload);
}

export function getBuilding(payload) {
  return ajaxPost('find_a_space_building', payload);
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