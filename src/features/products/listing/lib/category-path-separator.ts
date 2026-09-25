/**
 * Joins category segments into the backend's full-path form ("A > B > C").
 *
 * Kept in its own dependency-free module: `category-facet-tree` imports the ~31 KB static category
 * tree, and client code that only needs this constant (the product card's add-to-cart hook, via
 * `productDetailTransforms`) would otherwise ship that JSON on every page that renders a card.
 */
export const CATEGORY_PATH_SEPARATOR = " > "
