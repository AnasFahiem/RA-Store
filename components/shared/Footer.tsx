import { Link } from '@/lib/navigation';

export default function Footer() {
    return (
        <footer className="bg-zinc-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase">Direct From Factory</h3>
                        <p className="mt-4 text-base text-gray-500">
                            Premium gym gear manufactured by us, sold directly to you. No middlemen, just quality and durability.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase">Support</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link href="/size-guide" className="text-base text-gray-500 hover:text-accent">
                                    Size Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-base text-gray-500 hover:text-accent">
                                    Shipping & Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-base text-gray-500 hover:text-accent">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase">Stay Strong</h3>
                        <p className="mt-4 text-base text-gray-500">
                            Join our newsletter for factory updates and new drops.
                        </p>
                        {/* Newsletter form placeholder */}
                        <form className="mt-4 sm:flex sm:max-w-md">
                            <input
                                type="email"
                                required
                                className="appearance-none min-w-0 w-full bg-white border border-gray-300 py-2 px-4 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent"
                                placeholder="Enter your email"
                            />
                            <div className="mt-3 sm:mt-0 sm:ml-3">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center py-2 px-4 border border-transparent text-base font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    Subscribe
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
                    <p className="text-base text-gray-400">
                        &copy; {new Date().getFullYear()} Gym Gear Factory. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
