declare module 'axios/lib/adapters/http' {
    import { AxiosRequestConfig, AxiosResponse } from 'axios';

    function axiosHttpAdapter(
        config: AxiosRequestConfig,
    ): Promise<AxiosResponse>;

    export = axiosHttpAdapter;
}

declare module 'axios/lib/adapters/xhr' {
    import { AxiosRequestConfig, AxiosResponse } from 'axios';

    function axiosXHRAdapter(
        config: AxiosRequestConfig,
    ): Promise<AxiosResponse>;

    export = axiosXHRAdapter;
}
