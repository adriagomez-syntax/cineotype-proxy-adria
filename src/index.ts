export interface Env {
  TMDB_API_KEY: string
  MY_RATE_LIMITER: RateLimit
}

const TMDB = "https://api.themoviedb.org/3";
const ALLOWED = [
	"http://localhost:5173",
	"https://cineotype-adria.adria-gomez.workers.dev"
]

function searchRequest(searchParams: URLSearchParams, apiKey: string) {
	const query = searchParams.get("query") ?? ""
	const page = searchParams.get("page") ?? ""
	return `${TMDB}/search/movie?query=${encodeURIComponent(query)}${page && `&page=${page}`}&api_key=${apiKey}`
}

function getMovieRequest(pathname: string, apiKey: string) {
	const id = pathname.split("/")[2]
	return `${TMDB}/movie/${id}?api_key=${apiKey}`
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Rate limit
		const ip = request.headers.get("cf-connecting-ip") ?? "anon"
		const { success } = await env.MY_RATE_LIMITER.limit({ key: ip })
		if (!success) {
			return new Response("Too Many Requests", { status: 429 })
		}
		
		// Allowed access
		const origin = request.headers.get("Origin") ?? ""
		if (!ALLOWED.includes(origin))
		{
			return new Response("Forbidden", { status: 403 })
		}

		// CORS Control
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": origin,
					"Access-Control-Allow-Methods": "GET"
				}
			})
		}

		// Make the request
		const { pathname, searchParams } = new URL(request.url)

		let upstream: string
		if (pathname === "/search") {
			upstream = searchRequest(searchParams, env.TMDB_API_KEY)
		} else if (pathname.startsWith("/movie/")) {
			upstream = getMovieRequest(pathname, env.TMDB_API_KEY)
		} else {
			return new Response("Not found", { status: 404 });
		}

		let status = 200
		const apiRes = await fetch(upstream)
		if (!apiRes.ok) {
			status = apiRes.status
		}
		const data = await apiRes.json()

		// Return data
		return new Response(JSON.stringify(data), {
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
			status: status
		})
	},
} satisfies ExportedHandler<Env>;
