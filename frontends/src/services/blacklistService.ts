import api from "./api";

export const checkBlacklist = async (identifier: string, blacklistType?: string) => {
  let url = `/api/blacklist/check?identifier=${encodeURIComponent(identifier)}`;
  if (blacklistType) {
    url += `&blacklist_type=${encodeURIComponent(blacklistType)}`;
  }
  return api.post(url);
};
