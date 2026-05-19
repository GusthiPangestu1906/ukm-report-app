export const CACHE_KEYS = {
  draftQueue: 'medfo_draft_queue',
  staffName: 'medfo_staff_name',
  historyData: 'medfo_history_cache',
  historyTimestamp: 'medfo_history_ts',
  formState: 'medfo_form_state',
  userRole: 'medfo_user_role'
};

export const cache = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
