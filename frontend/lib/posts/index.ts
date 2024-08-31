import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import moment from 'moment';
import { remark } from 'remark';
import html from 'remark-html';

import type { PostItem } from "../types";

// Update the path to point to the correct posts directory
const postsDirectory = path.join(process.cwd(), 'src/app/blog/posts');

const getSortedPostsData = (): PostItem[] => {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf-8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the id
    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      category: matterResult.data.category,
    };
  });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    const format = "DD-MM-YYYY";
    if (moment(a.date, format).isBefore(moment(b.date, format))) {
      return -1;
    } else {
      return 1;
    }
  });
};

export const getCategorisedPosts = (): Record<string, PostItem[]> => {
  const allPostsData = getSortedPostsData();
  const categorisedPosts: Record<string, PostItem[]> = {};

  allPostsData.forEach(post => {
    if (!categorisedPosts[post.category]) {
      categorisedPosts[post.category] = [];
    }
    categorisedPosts[post.category].push(post);
  });

  return categorisedPosts;
};

export const getPostData = async (id: string) => {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf-8');
  const matterResult = matter(fileContents);
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    title: matterResult.data.title,
    category: matterResult.data.category,
    date: moment(matterResult.data.date, "DD-MM-YYYY").format("MMMM Do YYYY"),
  };
};
