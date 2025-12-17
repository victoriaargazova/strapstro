import qs from "qs";

/**
 * Fetches data from a Strapi API endpoint with optional query parameters and data unwrapping.
 *
 * @async
 * @param {Object} config - The configuration object for the API request
 * @param {string} config.endpoint - The API endpoint path (leading slash is optional)
 * @param {Object} [config.query] - Optional query parameters to be stringified and appended to the URL
 * @param {string} [config.wrappedByKey] - Optional key to unwrap the response data from a nested object
 * @param {boolean} [config.wrappedByList] - If true, extracts the first element from the response array
 * @param {Object} [options={}] - Optional fetch options (headers, method, body, etc.)
 * @returns {Promise<any>} The fetched and processed data from the API
 * @throws {Error} Throws an error if the fetch request fails
 *
 * @example
 * // Basic usage
 * const data = await fetchApi({ endpoint: '/articles' });
 *
 * @example
 * // With query parameters and unwrapping
 * const data = await fetchApi({
 *   endpoint: 'articles',
 *   query: { populate: '*', filters: { slug: 'my-article' } },
 *   wrappedByKey: 'data',
 *   wrappedByList: true
 * });
 */

export default async function fetchApi(
  { endpoint, query = undefined, wrappedByKey, wrappedByList = undefined },
  options = {}
) {
  if (endpoint.startsWith("/")) {
    endpoint = endpoint.slice(1);
  }

  const url = new URL(
    `${import.meta.env.STRAPI_URL}/api/${endpoint}${
      query ? `?${qs.stringify(query, { encode: false })}` : ``
    }`
  );

  console.log("Fetching...", url.toString());

  const res = await fetch(url.toString(), options);
  let data = await res.json();

  if (wrappedByKey) {
    data = data[wrappedByKey];
  }

  if (wrappedByList) {
    data = data[0];
  }

  return data;
}
