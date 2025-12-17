import url from "url";
import path from "path";
import slug from "slug";

console.log("Here we go!");

const SERVER_URL = "YOUR_STRAPI_SERVER_URL_HERE";

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
    categories.map(async (category) => {
      try {
        const result = await fetch(`${SERVER_URL}/api/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              name: category,
              slug: slug(category),
            },
          }),
        }).then((r) => r.json());

        if (result.error) {
          console.error(`Error inserting category ${category}:`, result.error);
        }

        return result;
      } catch (e) {
        console.error(`Failed to insert category ${category}:`, e);
        throw e;
      }
    })
  );

const insertProducts = async (products, strapiCategories) => {
  for (const product of products) {
    try {
      const { title, price, description, category, rating, image } = product;

      const data = {
        title,
        price,
        description,
        rating: rating.rate,
        category: strapiCategories.find((c) => c.data.name === category).data
          .id,
      };

      const result = await fetch(`${SERVER_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      }).then((r) => r.json());

      if (result.error) {
        console.error(`Error inserting product ${title}:`, result.error);
        continue;
      }

      console.log(`Product ${title} created with ID ${result.data.id}`);

      try {
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

        console.log(`Image uploaded for product ${title}`);
      } catch (imageError) {
        console.error(
          `Failed to upload image for product ${title}:`,
          imageError.message
        );
      }

      console.log(`Product ${title} inserted successfully!`);
    } catch (e) {
      console.error(
        `Failed to insert product ${product.title || "unknown"}:`,
        e.message
      );
    }
  }
};

const getProducts = () =>
  fetch("https://fakestoreapi.com/products").then((r) => r.json());

init();
