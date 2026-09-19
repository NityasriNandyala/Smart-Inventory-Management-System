package com.smartinventory.controller;

import com.smartinventory.model.Product;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final Map<String, Product> productDb = new ConcurrentHashMap<>();

    @GetMapping
    public List<Product> getAllProducts() {
        return new ArrayList<>(productDb.values());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        Product p = productDb.get(id);
        return p != null ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        if (product.getId() == null || product.getId().isEmpty()) {
            product.setId("prd-" + System.currentTimeMillis());
        }
        productDb.put(product.getId(), product);
        return ResponseEntity.ok(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody Product patch) {
        Product existing = productDb.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (patch.getName() != null) existing.setName(patch.getName());
        if (patch.getCategory() != null) existing.setCategory(patch.getCategory());
        if (patch.getPrice() != null) existing.setPrice(patch.getPrice());
        if (patch.getCost() != null) existing.setCost(patch.getCost());
        if (patch.getStock() != null) existing.setStock(patch.getStock());
        if (patch.getLowStockThreshold() != null) existing.setLowStockThreshold(patch.getLowStockThreshold());
        if (patch.getImage() != null) existing.setImage(patch.getImage());
        productDb.put(id, existing);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productDb.remove(id);
        return ResponseEntity.noContent().build();
    }
}
