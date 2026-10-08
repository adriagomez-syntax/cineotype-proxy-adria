export type Movie = {
	id: number
	overview: string
	poster_path: string | null
	release_date: string
	title: string
	vote_average: number
}

export type SearchResponse = {
	page: number
	results: Movie[]
	total_pages: number
	total_results: number
}

export type Genre = {
	id: number
	name: string
}

export type MovieDetails = Movie & {
	genres: Genre[]
	runtime: number
	tagline: string | undefined
}