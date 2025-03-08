const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");

const router = new express.Router();

// GET /companies - Get list of companies
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query("SELECT code, name FROM companies");
    return res.json({ companies: result.rows });
  } catch (err) {
    return next(err);
  }
});

// GET /companies/:code - Get details of a specific company, including invoices
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const companyResult = await db.query(
      "SELECT code, name, description FROM companies WHERE code = $1",
      [code]
    );
    if (companyResult.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }

    // Fetch invoices associated with the company
    const invoicesResult = await db.query(
      "SELECT id FROM invoices WHERE comp_code = $1",
      [code]
    );

    return res.json({
      company: {
        ...companyResult.rows[0],
        invoices: invoicesResult.rows.map(invoice => invoice.id),
      },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /companies - Add a new company
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// PUT /companies/:code - Edit an existing company
router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      "UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description",
      [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// DELETE /companies/:code - Delete a company
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query("DELETE FROM companies WHERE code = $1 RETURNING code", [code]);
    if (result.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
