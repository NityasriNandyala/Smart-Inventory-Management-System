package com.smartinventory.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String category;
    private String barcode;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal cost;

    private Integer stock;
    private Integer lowStockThreshold;

    @Column(length = 2048)
    private String image;
}
