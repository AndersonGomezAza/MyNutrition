-- Lets "add to list" upsert on (shopping_list_id, product_id) instead of
-- needing a select-then-insert-or-update round trip from the app.
alter table shopping_list_items
  add constraint shopping_list_items_list_product_key unique (shopping_list_id, product_id);
