import Link from "next/link";

// Removed TypeScript-specific import and interface

const PostItemList = ({ category, posts }) => { 
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-cormorantGaramond text-4xl">{category}</h2>
      <div className="flex flex-col gap-2.5 font-poppins text-lg">
        {posts.map((post, id) => ( // Changed post and id to be wrapped in parentheses
          <Link
            href={`/blog/${post.id}`}
            key={id}
            className="text-neutral-900 hover:text-neutral-950 transition duration-150"
          >
            {post.cover}
            {post.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PostItemList; // Corrected the export statement
