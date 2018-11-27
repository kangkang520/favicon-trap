/**
 * favicon的获取顺序为：
 * 		1、 拉取指定网址，并检测html代码中header->link标签是否存在favicon，如果存在则使用它们。
 * 		2、当第一步不满足的时候回进行猜测，一般猜测 favicon.ico、 favicon.png、 favicon.svg、favicon.gif，如果存在并且mime类型是图片则返回。
 * 		3、如果上面两步都不满足，则表示未找到favicon
 */

import url from 'url'
import request from 'request'

/** favicon option */
export interface FaviconOption {
	/** icon types that be allowed, such as: "icon"、"apple-touch-icon"， default: ['icon'] */
	types?: Array<string>
	/** timeout of request, default: 5000 */
	timeout?: number
	/** headers for http(s) request */
	headers?: { [i: string]: any }
}

/** return value of favicon function  */
export interface FavIcon {
	/** url of favicon */
	url: string
	/** size of favicon, when: `<link ... size="128x128" />` */
	size?: {
		width: number
		height: number
	}
}


//处理link标签
function parseLinkTag(uri: string, link: string, types: Array<string>): FavIcon | null {
	//内容读取
	link = ' ' + link.trim().replace(/(^<\s*link\s*)|(\s*\/?>$)/g, '')
	let match = link.match(/\srel\s*=\s*"([\s\S]+?)"/)
	if (!match) return null
	if (!match[1].trim().split(/\s+/).filter(t => types!.indexOf(t) >= 0).length) return null
	match = link.match(/\shref\s*=\s*"([\s\S]*?)"/)
	if (!match) return null
	let href = match[1]
	match = link.match(/\ssizes\s*=\s*"(\d+)[xX](\d+)"/)
	const size = match ? { width: parseInt(match[1]), height: parseInt(match[2]) } : undefined
	//连接处理
	if (!(/https?:\/\//.test(href))) {
		let { protocol, host, pathname } = url.parse(uri)
		protocol = protocol || 'https:'
		if (/\/\//.test(href)) href = protocol + href
		else {
			if (!host) return null
			if (href[0] == '/') href = protocol + '//' + host + href
			else href = protocol + '//' + host + (pathname || '').replace(/\/$/, '') + '/' + href
		}
	}
	return { url: href, size }
}

//从HTML中获取faviconnpm install favicon
async function getFavIconFromHtml(uri: string, option: FaviconOption): Promise<Array<FavIcon>> {
	return new Promise<Array<FavIcon>>(resolve => {
		request.get(uri, { timeout: option.timeout, headers: option.headers }, (err, res, body: string) => {
			if (err || !body || !body.match) resolve([])
			//获取所有link标签
			const match = body.match(/<link[\s\S]+?>/g)
			if (!match) return resolve([])
			const favicons = match.map(link => parseLinkTag(uri, link, option.types!)).filter(res => !!res)
			resolve(favicons as FavIcon[])
		})
	})
}

//猜测favicon
async function guessFavIcon(uri: string, option: FaviconOption): Promise<Array<FavIcon>> {
	//用于测试请求一个地址，请求成功返回地址否则返回空
	const fetch = (uri: string) => new Promise<string | null>(resolve => {
		request(uri, { timeout: option.timeout, headers: option.headers }, (err, res, body) => {
			if (err || !body || !res.headers['content-type']) resolve(null)
			if (/^image\//.test(res.headers['content-type']!)) resolve(uri)
			else resolve(null)
		})
	})
	//猜测某个网址
	const guessUri = async (uri: string): Promise<Array<FavIcon>> => {
		const urls = await Promise.all(['ico', 'png', 'gif', 'svg'].map(suf => fetch(uri + '/favicon.' + suf)))
		return urls.filter(s => !!s).map(s => ({ url: s! }))
	}
	const { protocol, port, host } = url.parse(uri)
	if (!host) return []
	//如果没有提供协议，则猜测http和https
	if (!protocol) {
		const [f1, f2] = await Promise.all([
			guessUri(`https://${host}`),
			guessUri(`http://${host}`),
		])
		return [...f1, ...f2]
	}
	//否则猜测给定的地址
	else return guessUri(`${protocol}//${host}`)
}

/**
 * get favicon from given url
 * @param uri URL
 * @param option Optional
 */
export async function favicon(uri: string, option?: FaviconOption) {
	//选项初始化
	option = option || {}
	option.types = option.types || ['icon']
	option.timeout = option.timeout || 5000
	option.headers = {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3610.2 Safari/537.36',
		...option.headers || {},
	}
	//从网页获取数据
	let icons = await getFavIconFromHtml(uri, option)
	if (!icons || !icons.length) icons = await guessFavIcon(uri, option)
	return icons
}