
type LayoutProps = {
    children: any;
}

const AuthLayout = ({ children }: LayoutProps) => {
    return (
        <div
            className="w-full h-screen bg-white overflow-hidden  grid grid-cols-1 lg:grid-cols-2"
        >


            <div className="relative hidden lg:block">
                <img
                    src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
                    alt="Luxury House"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/10"></div>

                <div className="absolute top-10 left-10 flex items-center gap-4 z-10">


                    <h1 className="text-3xl font-semibold text-white">
                        est8Ledger
                    </h1>
                </div>

                <div className="absolute bottom-20 left-14 text-white z-10">
                    <h2 className="text-5xl font-bold leading-tight max-w-md">
                        Find your sweet home
                    </h2>

                    <p className="mt-5 text-lg text-white/90">
                        Schedule visit in just a few clicks
                        <br />
                        visits in just a few clicks
                    </p>

                    <div className="flex items-center gap-2 mt-8">
                        <div className="w-14 h-2 rounded-full bg-white"></div>
                        <div className="w-2 h-2 rounded-full bg-white/70"></div>
                        <div className="w-2 h-2 rounded-full bg-white/70"></div>
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-center bg-white px-6 py-10 sm:px-10 md:px-14 md:py-14">
                {children}
            </div>
        </div>
    )
}

export default AuthLayout;