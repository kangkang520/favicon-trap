/**
 * favicon的获取顺序为：
 * 		1、 拉取指定网址，并检测html代码中header->link标签是否存在favicon，如果存在则使用它们。
 * 		2、当第一步不满足的时候回进行猜测，一般猜测 favicon.ico、 favicon.png、 favicon.svg、favicon.gif，如果存在并且mime类型是图片则返回。
 * 		3、如果上面两步都不满足，则表示未找到favicon
 */
/** favicon option */
export interface FaviconOption {
    /** icon types that be allowed, such as: "icon"、"apple-touch-icon"， default: ['icon'] */
    types?: Array<string>;
    /** timeout of request, default: 5000 */
    timeout?: number;
    /** headers for http(s) request */
    headers?: {
        [i: string]: any;
    };
}
/** return value of favicon function  */
export interface FavIcon {
    /** url of favicon */
    url: string;
    /** size of favicon, when: `<link ... size="128x128" />` */
    size?: {
        width: number;
        height: number;
    };
}
/**
 * get favicon from given url
 * @param uri URL
 * @param option Optional
 */
export declare function favicon(uri: string, option?: FaviconOption): Promise<FavIcon[]>;
