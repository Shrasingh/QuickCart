import { Suspense } from "react"
import OrderSuccessContent from "./order-success-content"

const OrderSuccessPage = () => {
  return (
    <Suspense>
      <OrderSuccessContent />
    </Suspense>
  )
}

export default OrderSuccessPage
