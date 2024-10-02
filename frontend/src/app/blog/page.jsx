import Container from "@components/landing-page/container";
import { HeroPost } from "@components/landing-page/hero-post";
import BlogHeader from "@components/landing-page/blogHeader";
import { MoreStories } from "@components/landing-page/more-stories";
import { getAllPosts } from "@lib/api";
import { Footer } from "@/components/landing-page/Footer";
import Navbar from "@/components/landing-page/Navbar";

export default function Index() {
  const allPosts = getAllPosts();

  const heroPost = allPosts[0];

  const morePosts = allPosts.slice(1);

  return (
    <main>
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
      <Container>
        <BlogHeader />
        <HeroPost
          title={heroPost.title}
          coverImage={heroPost.coverImage}
          date={heroPost.date}
          author={heroPost.author}
          slug={heroPost.slug}
          excerpt={heroPost.excerpt}
        />
        {morePosts.length > 0 && <MoreStories posts={morePosts} />}
      </Container>
      <Footer/>
    </main>
  );
}