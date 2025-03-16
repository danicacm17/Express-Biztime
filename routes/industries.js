const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");

const router = new express.Router();

// GET /industries - List all industries and associated companies
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT i.code, i.industry, c.code AS company_code, c.name AS company_name
       FROM industries AS i
       LEFT JOIN companies_industries AS ci ON ci.industry_code = i.code
       LEFT JOIN companies AS c ON c.code = ci.company_code`
    );
    const industries = result.rows.reduce((acc, row) => {
      const { code, industry, company_code, company_name } = row;
      if (!acc[code]) {
        acc[code] = { code, industry, companies: [] };
      }
      if (company_code) {
        acc[code].companies.push({ company_code, company_name });
      }
      return acc;
    }, {});

    return res.json({ industries: Object.values(industries) });
  } catch (err) {
    return next(err);
  }
});

// GET /industries/:code - Get details of a specific industry and associated companies
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query(
      `SELECT i.code, i.industry, c.code AS company_code, c.name AS company_name
       FROM industries AS i
       LEFT JOIN companies_industries AS ci ON ci.industry_code = i.code
       LEFT JOIN companies AS c ON c.code = ci.company_code
       WHERE i.code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError("Industry not found", 404);
    }

    const industry = {
      code: result.rows[0].code,
      industry: result.rows[0].industry,
      companies: result.rows.map(row => ({
        company_code: row.company_code,
        company_name: row.company_name
      }))
    };

    return res.json({ industry });
  } catch (err) {
    return next(err);
  }
});

// POST /industries - Add a new industry
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry) 
       VALUES ($1, $2) 
       RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// POST /industries/:industry_code/companies/:company_code - Associate an industry to a company
router.post("/:industry_code/companies/:company_code", async (req, res, next) => {
  try {
    const { industry_code, company_code } = req.params;
    const checkIndustry = await db.query(
      `SELECT code FROM industries WHERE code = $1`,
      [industry_code]
    );
    if (checkIndustry.rows.length === 0) {
      throw new ExpressError("Industry not found", 404);
    }

    const checkCompany = await db.query(
      `SELECT code FROM companies WHERE code = $1`,
      [company_code]
    );
    if (checkCompany.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }

    const result = await db.query(
      `INSERT INTO companies_industries (company_code, industry_code) 
       VALUES ($1, $2) 
       RETURNING company_code, industry_code`,
      [company_code, industry_code]
    );

    return res.status(201).json({ association: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
