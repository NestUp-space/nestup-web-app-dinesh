
import { getCategorisedPosts } from '@lib/posts';
import PostItemList from '@/components/postListItem';

// This function can be async if needed to fetch data
export default function Blog() {
  // Fetch the data directly in the component
  const allPostsData = getCategorisedPosts();

  return (
    <div className="p-8">
      <section className="mx-auto w-11/12 md:w-1/2 mt-20 flex flex-col gap-16 mb-20">
        <header className="font-cormorantGaramond font-light text-6xl text-neutral-900 text-center">
          <h2>Blog</h2>
        </header>
        <section className="md:grid md:grid-cols-2 flex flex-col gap-10">
          {allPostsData && // Corrected posts to allPostsData
            Object.keys(allPostsData).map((category) => (
              <PostItemList 
                key={category} // Corrected key positioning
                category={category} 
                posts={allPostsData[category]}
              />
            ))}
        </section>
      </section>
    </div>
  );
}
