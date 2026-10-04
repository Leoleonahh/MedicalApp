import { Request, Response } from "express";
import { updatePharmacyProduct } from "../services/pharmacyProduct.service";
import { getProductsByPharmacy } from "../services/pharmacyProduct.service";
import { createProductForPharmacy, getProductTypes } from "../services/pharmacyProduct.service";

export const createProduct = async (
  req: Request & { user?: any },
  res: Response
) => {
  try {
    const pharmacyId = Number(req.params.pharmacyId);
    const { product_name, description, typepro_id, price, stock } = req.body;

    const product = await createProductForPharmacy(
      pharmacyId,
      req.user?.user_id,
      {
        product_name,
        description,
        typepro_id: Number(typepro_id),
        image: req.file?.filename || null,
        price: Number(price),
        stock: Number(stock),
      }
    );

    return res.status(201).json({
      success: true,
      message: "Product added to pharmacy",
      data: product,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add product";
    return res.status(400).json({ success: false, message });
  }
};

export const listProductTypes = async (_req: Request, res: Response) => {
  try {
    const types = await getProductTypes();
    return res.json({ success: true, data: types });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load product types";
    return res.status(500).json({ success: false, message });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
) => {

  try {

    const pharmacyId = Number(req.params.pharmacyId);

    const pharmacyProductId = Number(req.params.pharmacyProductId);

    const { price, stock } = req.body;

    const result = await updatePharmacyProduct(
      pharmacyId,
      pharmacyProductId,
      {
        price,
        stock,
      }
    );

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: result,
    });

  } catch (err: any) {

    return res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};

export const getProducts = async (
  req: Request,
  res: Response
) => {

  try {

    const pharmacyId = Number(req.params.pharmacyId);

    const products = await getProductsByPharmacy(pharmacyId);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    return res.json({
      success: true,
      pharmacy: {
        pharmacy_id: products[0].pharmacy.pharmacy_id,
        pharmacy_name: products[0].pharmacy.pharmacy_name,
      },
      products: products.map(item => ({
        pharmacy_product_id: item.pharmacy_product_id,
        product_id: item.product.product_id,
        product_name: item.product.product_name,
        type: item.product.typepro?.type_name,
        image: item.product.image,
        price: item.price,
        stock: item.stock,
      })),
    });

  } catch (err: any) {

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};