import { Link } from '@/lib/navigation';

export default function Footer() {
    return (
        <footer className="bg-background border-t border-border transition-colors duration-300">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-wider uppercase">Direct From Factory</h3>
                        <p className="mt-4 text-base text-muted-foreground">
                            Premium gym gear manufactured by us, sold directly to you. No middlemen, just quality and durability.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-wider uppercase">Support</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link href="/size-guide" className="text-base text-muted-foreground hover:text-accent font-medium">
                                    Size Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-base text-muted-foreground hover:text-accent font-medium">
                                    Shipping & Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-base text-muted-foreground hover:text-accent font-medium">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-wider uppercase">Stay Strong</h3>
                        <p className="mt-4 text-base text-muted-foreground">
                            Join our newsletter for factory updates and new drops.
                        </p>
                        {/* Newsletter form placeholder */}
                        <form className="mt-4 sm:flex sm:max-w-md">
                            <input
                                type="email"
                                required
                                className="appearance-none min-w-0 w-full bg-background border border-border py-2 px-4 text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-accent focus:border-accent"
                                placeholder="Enter your email"
                            />
                            <div className="mt-3 sm:mt-0 sm:ml-3">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center py-2 px-4 border border-transparent text-base font-medium text-black bg-accent hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
                                >
                                    Subscribe
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="mt-8 border-t border-border pt-8 md:flex md:items-center md:justify-between">
                    <p className="text-base text-muted-foreground">
                        &copy; {new Date().getFullYear()} Gym Gear Factory. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
