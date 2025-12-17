import url from "url";
import path from "path";

console.log("Here we go!");

const SERVER_URL = "http://localhost:1337";

const init = async () => {
  const products = await getProducts();
  const categories = getUniqueCategories(products);
  const strapiCategories = await insertCategories(categories);
  insertProducts(products, strapiCategories);
};

const getUniqueCategories = (products) => [
  ...new Set(products.map((p) => p.category)),
];

const insertCategories = (categories) =>
  Promise.all(
    categories.map((category) =>
      fetch(`${SERVER_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            name: category,
          },
        }),
      }).then((r) => r.json())
    )
  );

// ⬇️ Only ONE insertProducts, using the categories returned by insertCategories
const insertProducts = (products, strapiCategories) => {
  console.log("Strapi categories (raw):", strapiCategories);

  products.forEach(async (product) => {
    try {
      const { title, price, description, category, rating, image } = product;

      console.log("Importing product:", title, "with category:", category);

      // insertCategories returns an array of { data: { id, attributes: { name } } } in Strapi v4/v5
      const matched = strapiCategories.find(
        (c) => c.data && c.data.name === category || c.data?.attributes?.name === category
      );

      if (!matched) {
        console.error("No category found in Strapi for:", category);
        return;
      }

      const categoryId =
        matched.data.id ||
        matched.data.documentId || // if you use documentId as relation
        matched.id;                // fallback if shape is flatter

      const data = {
        title,
        price,
        description,
        rating: rating.rate,
        category: categoryId,
      };

      console.log("Data to send to Strapi:", data);

      const result = await fetch(`${SERVER_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      }).then((r) => r.json());

      if (result.error) {
        console.error("Error from Strapi when creating product:", result.error);
        return;
      }

      const form = new FormData();

      const blob = await fetch(image).then((r) => r.blob());
      const filename = path.basename(url.parse(image).pathname);
      form.append("files", blob, filename);
      form.append("ref", "api::product.product");
      form.append("refId", result.data.id);
      form.append("field", "image");

      await fetch(`${SERVER_URL}/api/upload`, {
        method: "post",
        body: form,
      });

      console.log(`Product ${title} inserted!`);
    } catch (e) {
      console.error("Error while importing product:", e);
    }
  });
};

const getProducts = () =>
  fetch("https://fakestoreapi.com/products").then((r) => r.json());

init();
