USE mini_crud;

INSERT INTO categories(name) VALUES
('Đồ ăn'), ('Nước uống'), ('Phụ kiện')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO products(category_id, name, price, description) VALUES
(1, 'Bánh mì', 20000, 'Bánh mì thịt'),
(2, 'Trà sữa', 35000, 'Size M'),
(3, 'Tai nghe', 120000, 'Loại cơ bản');