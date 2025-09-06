# /Users/duncan/dev/personal-projects/waystation/backend/seed.py
import asyncio
import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import config

# It's crucial to import your specific models and the session manager
from app.models import (
    RFQ,
    Certification,
    Email,
    Quote,
    Supplier,
    quote_certification_association,
    rfq_certification_association,
)
from app.services.database import sessionmanager

# You will need to configure the session manager with your database URL
sessionmanager.init(config.DB_CONFIG)


async def clear_data(db: AsyncSession):
    """Deletes all data from the tables in the correct order."""
    # Delete from association tables first
    await db.execute(quote_certification_association.delete())
    await db.execute(rfq_certification_association.delete())
    # Delete from tables with foreign keys
    await db.execute(Email.__table__.delete())
    await db.execute(Quote.__table__.delete())
    # Delete from remaining tables
    await db.execute(RFQ.__table__.delete())
    await db.execute(Supplier.__table__.delete())
    await db.execute(Certification.__table__.delete())
    await db.commit()
    print("✅ Cleared all existing data.")


async def seed_data():
    """
    Populates the database with a complete and logical set of sample data
    for development and testing purposes.
    """
    async with sessionmanager.session() as db:
        print("Starting to seed database...")

        # 1. Wipe all existing data to ensure a clean slate
        await clear_data(db)

        # 2. Create Certifications 📜
        certs_to_create = ["Non-GMO", "Halal", "Allergen Free", "Organic"]
        cert_models = [Certification(name=cert) for cert in certs_to_create]
        db.add_all(cert_models)
        await db.flush()  # Flush to assign IDs
        certs = {c.name: c for c in cert_models}
        print(f"🌱 Staged {len(certs)} certifications.")

        # 3. Create Suppliers 🏢
        supplier1 = Supplier(
            company_name="Global Ingredients Inc.",
            contact_name="Jane Doe",
            contact_email="jane.doe@global-ingredients.com",
            contact_phone="111-222-3333",
            hq_address="123 Supply St, Foodville, USA",
            payment_terms="Net 30",
        )
        supplier2 = Supplier(
            company_name="Farm Fresh Organics",
            contact_name="John Smith",
            contact_email="john.smith@farm-fresh.com",
            contact_phone="444-555-6666",
            hq_address="456 Farmer Rd, Greenfield, USA",
            payment_terms="Net 60",
        )
        supplier3 = Supplier(
            company_name="Incomplete Supplies Co.",
            contact_name="Chris P. Bacon",
            contact_email="chris.b@incomplete-supplies.com",
            contact_phone="777-888-9999",
            hq_address="789 Missing Ave, Nowhere, USA",
            payment_terms="COD",
        )
        db.add_all([supplier1, supplier2, supplier3])
        print("🌱 Staged 3 suppliers.")

        # 4. Create RFQs (Requests for Quotes) 📝
        rfq1 = RFQ(
            item="Soy Protein Isolate",
            due_date=datetime.datetime(2025, 10, 15, tzinfo=datetime.timezone.utc),
            amount_required_lbs=50000.0,
            ship_to_location="Chicago, IL",
            required_certifications=[certs["Non-GMO"], certs["Halal"]],
        )
        rfq2 = RFQ(
            item="Organic Pea Protein",
            due_date=datetime.datetime(2025, 11, 1, tzinfo=datetime.timezone.utc),
            amount_required_lbs=25000.0,
            ship_to_location="Los Angeles, CA",
            required_certifications=[certs["Organic"], certs["Allergen Free"]],
        )
        rfq3 = RFQ(
            item="Whey Protein Concentrate",
            due_date=datetime.datetime(2025, 11, 30, tzinfo=datetime.timezone.utc),
            amount_required_lbs=10000.0,
            ship_to_location="Miami, FL",
            required_certifications=[certs["Non-GMO"], certs["Allergen Free"]],
        )
        db.add_all([rfq1, rfq2, rfq3])
        print("🌱 Staged 3 RFQs.")

        # 5a. Create COMPLETE Quotes in response to RFQs 💰
        quote1 = Quote(
            supplier=supplier1,
            rfq=rfq1,
            price_per_pound=2.55,
            country_of_origin="USA",
            min_order_quantity=5000,
            certifications=[certs["Non-GMO"]],
        )
        quote2 = Quote(
            supplier=supplier2,
            rfq=rfq1,
            price_per_pound=2.48,
            country_of_origin="Canada",
            min_order_quantity=10000,
            certifications=[certs["Non-GMO"], certs["Halal"]],
        )
        quote3 = Quote(
            supplier=supplier2,
            rfq=rfq2,
            price_per_pound=4.10,
            country_of_origin="USA",
            min_order_quantity=2000,
            certifications=[certs["Organic"], certs["Allergen Free"]],
        )
        db.add_all([quote1, quote2, quote3])
        print("🌱 Staged 3 complete quotes.")

        # 5b. Create INCOMPLETE Quotes for testing clarification features 🧐
        quote4_missing_price = Quote(
            supplier=supplier3,
            rfq=rfq3,
            price_per_pound=None,  # MISSING
            country_of_origin="USA",
            min_order_quantity=1000,
            certifications=[certs["Non-GMO"], certs["Allergen Free"]],
        )
        quote5_missing_moq_and_cert = Quote(
            supplier=supplier1,
            rfq=rfq3,
            price_per_pound=5.50,
            country_of_origin="Ireland",
            min_order_quantity=None,  # MISSING
            certifications=[certs["Non-GMO"]],  # MISSING Allergen Free
        )
        quote6_missing_everything = Quote(
            supplier=supplier2,
            rfq=rfq3,
            price_per_pound=None,  # MISSING
            country_of_origin=None,  # MISSING
            min_order_quantity=None,  # MISSING
            certifications=[],  # MISSING ALL
        )
        db.add_all([quote4_missing_price, quote5_missing_moq_and_cert, quote6_missing_everything])
        print("🌱 Staged 3 incomplete quotes.")

        # 6. Create Email logs for each Quote 📧
        email1 = Email(
            raw_text="Hello, here is our quote for Soy Protein...",
            extracted_data={"price_per_pound": 2.55, "country_of_origin": "USA"},
            quote=quote1,
        )
        email2 = Email(
            raw_text="Hi there - responding to RFQ for soy isolate...",
            extracted_data={"price_per_pound": 2.48, "country_of_origin": "Canada"},
            quote=quote2,
        )
        email3 = Email(
            raw_text="For the Organic Pea Protein, our price is $4.10/lb...",
            extracted_data={"price_per_pound": 4.10, "country_of_origin": "USA"},
            quote=quote3,
        )
        email4 = Email(
            raw_text="Re: Whey Protein. Sourced from USA, MOQ 1000lbs. We have Non-GMO and Allergen Free certs.",
            extracted_data={
                "country_of_origin": "USA",
                "min_order_quantity": 1000,
                "certifications": ["Non-GMO", "Allergen Free"],
            },
            quote=quote4_missing_price,
        )
        email5 = Email(
            raw_text="Hello - for the Whey, our price is $5.50 per pound from Ireland. We are Non-GMO certified.",
            extracted_data={"price_per_pound": 5.50, "country_of_origin": "Ireland", "certifications": ["Non-GMO"]},
            quote=quote5_missing_moq_and_cert,
        )
        email6 = Email(
            raw_text="Hi, we can supply the Whey Protein Concentrate you requested. Let me know if you need more info.",
            extracted_data={},  # Extracted nothing of value
            quote=quote6_missing_everything,
        )
        db.add_all([email1, email2, email3, email4, email5, email6])
        print("🌱 Staged 6 email logs (3 complete, 3 incomplete).")

        # 7. Final Commit 🚀
        await db.commit()
        print("\n🎉 Successfully committed all data to the database!")


async def main():
    """
    Initializes the database connection using the centralized config
    and runs the seeding process.
    """
    sessionmanager.init(config.DB_CONFIG)
    await seed_data()
    await sessionmanager.close()


if __name__ == "__main__":
    asyncio.run(main())