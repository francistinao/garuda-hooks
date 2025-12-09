export enum STORAGE_ENV {
    LOCAL_STORAGE = 'localStorage',
    SESSION_STORAGE = 'sessionStorage',
}

export const storageEnv = (env: STORAGE_ENV) => {
    const window = globalThis.window as Window;
    return env === STORAGE_ENV.LOCAL_STORAGE ? window.localStorage : window.sessionStorage;
}