from dataclasses import dataclass

from app.models.coupon import Coupon, DiscountType


@dataclass
class LineCalc:
    line_net: float
    line_vat: float
    line_total: float
    line_govt_fee: float


def calc_line(qty: float, unit_price: float, discount: float, vat_rate: float, govt_fee: float) -> LineCalc:
    gross = qty * unit_price
    net = max(gross - discount, 0)
    vat = net * (vat_rate / 100)
    total = net + vat
    return LineCalc(line_net=round(net, 2), line_vat=round(vat, 2), line_total=round(total, 2), line_govt_fee=round(govt_fee * qty, 2))


@dataclass
class InvoiceTotals:
    subtotal: float
    line_discount_total: float
    coupon_discount: float
    discount_total: float
    vat_total: float
    govt_fee_total: float
    grand_total: float


def calc_invoice_totals(
    lines: list[LineCalc],
    line_discounts: list[float],
    coupon: Coupon | None,
) -> InvoiceTotals:
    subtotal = round(sum(l.line_net for l in lines), 2)
    vat_total = round(sum(l.line_vat for l in lines), 2)
    govt_fee_total = round(sum(l.line_govt_fee for l in lines), 2)
    line_discount_total = round(sum(line_discounts), 2)

    coupon_discount = 0.0
    if coupon is not None:
        if coupon.discount_type == DiscountType.percent:
            coupon_discount = subtotal * (float(coupon.value) / 100)
        else:
            coupon_discount = float(coupon.value)
        coupon_discount = round(min(coupon_discount, subtotal), 2)

    grand_total = round(subtotal - coupon_discount + vat_total + govt_fee_total, 2)

    return InvoiceTotals(
        subtotal=subtotal,
        line_discount_total=line_discount_total,
        coupon_discount=coupon_discount,
        discount_total=round(line_discount_total + coupon_discount, 2),
        vat_total=vat_total,
        govt_fee_total=govt_fee_total,
        grand_total=grand_total,
    )
