/** URL of a stay's page, using its readable slug when there is one. */
export const stayPath = (stay: { id: string; slug?: string | null }) => `/stays/${stay.slug || stay.id}`;
