import { Movie, SearchResponse } from "./types/movie";

export interface Env {
  TMDB_API_KEY: string
  MY_RATE_LIMITER: RateLimit
}

const TMDB = "https://api.themoviedb.org/3";
const ALLOWED = [
	"http://localhost:5173",
	"https://cineotype-adria.adria-gomez.workers.dev"
]

async function searchRequest(searchParams: URLSearchParams, apiKey: string): Promise<Response> {
	const query = searchParams.get("query") ?? ""
	const page = searchParams.get("page") ?? ""
	const upstream = `${TMDB}/search/movie?query=${encodeURIComponent(query)}${page && `&page=${page}`}&api_key=${apiKey}`

	return await doRequest<SearchResponse>(upstream)
}

async function getMovieRequest(pathname: string, apiKey: string): Promise<Response> {
	const id = pathname.split("/")[2]
	const upstream = `${TMDB}/movie/${id}?api_key=${apiKey}`

	return await doRequest<Movie>(upstream)
}

async function doRequest<T>(upstream: string): Promise<Response> {
	
	let status = 200
	const apiRes = await fetch(upstream)
	if (!apiRes.ok) {
		status = apiRes.status
	}
	const data: T = await apiRes.json()

	// Return data
	return new Response(JSON.stringify(data), {
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
		status: status
	})
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

		if (pathname === "/search") { return await searchRequest(searchParams, env.TMDB_API_KEY) } 
		else if (pathname.startsWith("/movie/")) { return await getMovieRequest(pathname, env.TMDB_API_KEY) }

		// Not a valid path
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
