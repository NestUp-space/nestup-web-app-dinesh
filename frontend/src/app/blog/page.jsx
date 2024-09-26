import Container from "@components/container";
import { HeroPost } from "@components/hero-post";
import BlogHeader from "@components/blogHeader";
import { MoreStories } from "@components/more-stories";
import { getAllPosts } from "@lib/api";
import { Footer } from "@/components/Footer";

export default function Index() {
  const allPosts = getAllPosts();

  const heroPost = allPosts[0];

  const morePosts = allPosts.slice(1);

  return (
    <main>
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