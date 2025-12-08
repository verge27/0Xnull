import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CreateListingInput } from '@/hooks/useListings';

interface CsvImportDialogProps {
  onImport: (listings: CreateListingInput[]) => Promise<number>;
}

interface ParsedRow {
  title: string;
  description: string;
  price_usd: number;
  category: string;
  stock: number;
  shipping_price_usd: number;
  condition: string;
  images: string[];
  isValid: boolean;
  errors: string[];
}

export const CsvImportDialog = ({ onImport }: CsvImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRow = (row: any): ParsedRow => {
    const errors: string[] = [];
    
    const title = String(row.title || row.Title || '').trim();
    const description = String(row.description || row.Description || '').trim();
    const priceRaw = row.price_usd || row.price || row.Price || row['Price USD'] || 0;
    const price_usd = parseFloat(String(priceRaw)) || 0;
    const category = String(row.category || row.Category || 'Physical').trim();
    const stockRaw = row.stock || row.Stock || row.quantity || row.Quantity || 1;
    const stock = parseInt(String(stockRaw)) || 1;
    const shippingRaw = row.shipping_price_usd || row.shipping || row.Shipping || row['Shipping USD'] || 0;
    const shipping_price_usd = parseFloat(String(shippingRaw)) || 0;
    const condition = String(row.condition || row.Condition || 'new').trim().toLowerCase();
    const imageUrl = String(row.image_url || row.images || row.Image || row['Image URL'] || '').trim();
    const images = imageUrl ? [imageUrl] : [];

    if (!title || title.length < 3) errors.push('Title too short');
    if (!description || description.length < 10) errors.push('Description too short');
    if (price_usd <= 0) errors.push('Invalid price');
    if (stock < 1) errors.push('Invalid stock');

    return {
      title,
      description,
      price_usd,
      category,
      stock,
      shipping_price_usd,
      condition,
      images,
      isValid: errors.length === 0,
      errors
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsed = jsonData.map(validateRow);
        setParsedData(parsed);
        
        const validCount = parsed.filter(r => r.isValid).length;
        toast.info(`Parsed ${parsed.length} rows, ${validCount} valid`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please check the format.');
        setParsedData([]);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    const listings: CreateListingInput[] = validRows.map(row => ({
      title: row.title,
      description: row.description,
      price_usd: row.price_usd,
      category: row.category,
      stock: row.stock,
      shipping_price_usd: row.shipping_price_usd,
      condition: row.condition,
      images: row.images
    }));

    const count = await onImport(listings);
    setImporting(false);

    if (count > 0) {
      toast.success(`Successfully imported ${count} listings`);
      setOpen(false);
      setParsedData([]);
      setFileName('');
    }
  };

  const resetDialog = () => {
    setParsedData([]);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Import CSV/XLS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Listings from CSV/XLS</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label>Upload File</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Expected columns: title, description, price_usd, category, stock, shipping_price_usd, condition, image_url
            </p>
          </div>

          {parsedData.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="text-green-500 font-medium">
                    {parsedData.filter(r => r.isValid).length} valid
                  </span>
                  {' / '}
                  <span className="text-red-500 font-medium">
                    {parsedData.filter(r => !r.isValid).length} invalid
                  </span>
                  {' of '}
                  {parsedData.length} rows
                </p>
              </div>

              <div className="flex-1 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((row, index) => (
                      <TableRow key={index} className={row.isValid ? '' : 'bg-destructive/10'}>
                        <TableCell>
                          {row.isValid ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.title}</TableCell>
                        <TableCell>${row.price_usd.toFixed(2)}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.stock}</TableCell>
                        <TableCell className="text-red-500 text-xs">
                          {row.errors.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    Showing first 50 rows of {parsedData.length}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetDialog}>
                  Clear
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importing || parsedData.filter(r => r.isValid).length === 0}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? 'Importing...' : `Import ${parsedData.filter(r => r.isValid).length} Listings`}
                </Button>
              </div>
            </>
          )}

          {parsedData.length === 0 && fileName && (
            <div className="text-center text-muted-foreground py-8">
              No data found in file
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
