/**
 * The complete metadata record stored alongside each LanceDB row.
 * ALL fields are present — either a real value or a safe default ("" or 0).
 */
export interface ClothingMetadata {
  product_no: string;       
  int_code: string;        
  brand: string;           
  name: string;            
  category: string;       
  family: string;          
  photo_url: string;        
  colour: string;          
  size: string;            
  size_range: string;       
  sustainability: string;   
  material: string;         
  quality: string;          
  gender: string;           
  gross_weight: number;     
  netto_weight: number;    
  qty_in_box: number;       
  country_of_origin: string;
  ean: string;              
  description: string;      
  price: number;            
  sales_by_piece: string;   
  discount: number;         
}


/** A LanceDB row = metadata + document text + embedding vector */
export interface LanceRow extends ClothingMetadata {
  text: string;             // merged document text (for reference)
  vector: number[];         // 384-dimensional embedding
}