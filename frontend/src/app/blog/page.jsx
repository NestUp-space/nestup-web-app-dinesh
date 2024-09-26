import Container from "@components/container";
import { HeroPost } from "@components/hero-post";
import BlogHeader from "@components/blogHeader";
import { MoreStories } from "@components/more-stories";
import { getAllPosts } from "@lib/api";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Index() {
  const allPosts = getAllPosts();

  const heroPost = allPosts[0];

  const morePosts = allPosts.slice(1);

  return (
    <main>
      <div className="h-24 top-0 fixed bg-white z-50">
         <Navbar />
      </div>
      <Container className="mt-24">
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