import {Billboard as BillboardType} from "@/type"

interface BillboardTypeProps  {
    data : BillboardType
}
const Billboard : React.FC<BillboardTypeProps> = ({
    data
}) => {

    return (
        <div className="p-4 sm:p-6 lg:p-8 rounded-xl overflow-hidden">
            <div
            className="rounded-xl relative aspect-square md:aspect-[2.4/1] overflow-hidden bg-cover bg-center"
            style={{backgroundImage: `url(${data.imageUrl})`}}
            >
                {data.label && (
                <div className="h-full w-full flex flex-col justify-center items-center text-center gap-y-8 bg-black/30">
                    <div className="font-bold text-3xl sm:text-5xl lg:text-6xl sm:max-w-xl max-w-xs text-white drop-shadow-lg">
                        {data.label}
                    </div>
                </div>
                )}
            </div>
        </div>
    )
} 
export default Billboard