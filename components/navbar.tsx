
import Link from "next/link"

import MainNav from "./main-nav"
import Container from "./ui/container"
import getCategories from "@/actions/get-categories"
import NavbarActions from "./navbar-actions"
import SearchBar from "./search-bar"

export const revalidate = 0;

const Navbar = async () => {
    const categories = await getCategories();

    return (
        <div className="border-b">
            
            <Container >
                <div className="relative px-4 sm:px-6 lg:px-8 flex h-16 items-center">
                    <Link href='/' className="ml-4 lg:ml-0 flex items-center gap-x-2" >
                        <p className="font-bold text-xl">QuickCart</p>
                    </Link>
                    <MainNav data={categories}/>
                    <SearchBar/>
                    <NavbarActions/>
                </div>
             </Container>
        </div>
    )
}

export default Navbar