// remove html tags
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function getCustomAttribute(product: any, attributeCode: string): string {
  const attribute = product.custom_attributes.find((attr: any) => attr.attribute_code === attributeCode);
  // console.log(">>>>>>>", attribute.value)
  return attribute ? attribute.value : '';
}