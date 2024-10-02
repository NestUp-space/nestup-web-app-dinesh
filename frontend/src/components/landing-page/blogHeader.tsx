import Link from "next/link";

const Header = () => {
  return (
    <h2 className="text-theme-color text-3xl md:text-5xl font-bold tracking-tight md:tracking-tighter leading-tight mb-20 mt-8 flex items-center">
      <Link href="/blog" className="hover:underline">
        Blog.
      </Link>
    </h2>
  );
};

export default Header;
