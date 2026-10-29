import getProducts from "@/actions/get-products"
import getSizes from "@/actions/get-sizes"
import getColors from "@/actions/get-colors"
import Container from "@/components/ui/container"
import Filter from "../category/[categoryId]/components/filter"
import MobileFilters from "../category/[categoryId]/components/mobile-filters"
import PriceFilter from "@/components/price-filter"
import NoResults from "@/components/ui/no-results"
import ProductCard from "@/components/ui/product-card"
import { firstParam, priceParam, type RawParam } from "@/lib/search-params"

export const revalidate = 0

interface ProductsPageProps {
  // A key repeated in the URL arrives as string[]; see lib/search-params.ts.
  searchParams: Promise<{
    q?: RawParam
    colorId?: RawParam
    sizeId?: RawParam
    minPrice?: RawParam
    maxPrice?: RawParam
  }>
}

const ProductsPage = async (props: ProductsPageProps) => {
  const searchParams = await props.searchParams
  const query = firstParam(searchParams.q)

  // Independent requests, issued together (see category page).
  const [products, sizes, colors] = await Promise.all([
    getProducts({
      search: query,
      colorId: firstParam(searchParams.colorId),
      sizeId: firstParam(searchParams.sizeId),
      minPrice: priceParam(searchParams.minPrice),
      maxPrice: priceParam(searchParams.maxPrice),
    }),
    getSizes(),
    getColors(),
  ])

  return (
    <div className="bg-white">
      <Container>
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {query ? `Results for "${query}"` : "All Products"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-24 pt-6">
          <div className="lg:grid lg:grid-cols-5 lg:gap-x-8">
            <MobileFilters sizes={sizes} colors={colors} />
            <div className="hidden lg:block">
              <Filter valueKey="sizeId" name="Sizes" data={sizes} />
              <Filter valueKey="colorId" name="Colors" data={colors} />
              <PriceFilter />
            </div>
            <div className="mt-6 lg:col-span-4 lg:mt-0">
              {products.length === 0 ? (
                <NoResults
                  title={query ? `No results for "${query}"` : "No products found"}
                  message={
                    query
                      ? "We couldn't find any products matching your search. Try a different term or browse the full catalog."
                      : "No products match your filters. Try clearing them or explore the full catalog."
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} data={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default ProductsPage
