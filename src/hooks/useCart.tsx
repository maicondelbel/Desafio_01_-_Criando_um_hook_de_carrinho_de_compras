import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)
      const { data: product } = await api.get<Product>(`/products/${productId}`)

      const hasProductInCart = cart.find((product) => product.id === productId)
      const isOutOfStock = stock.amount === hasProductInCart?.amount

      if(isOutOfStock){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (hasProductInCart) {
        const updatedCart = cart.map((cartItem) => {
          if (cartItem.id === productId) {
              return { ...cartItem, amount: cartItem.amount + 1 }
          }
          return cartItem
        })

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

      } else {
        const updatedCart = [...cart, {...product, amount: 1}]

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const hasProductInCart = cart.find((product) => product.id === productId)

      if (!hasProductInCart) {
        toast.error('Erro na remoção do produto');
        return
      }

      const updatedCart =  cart.filter((cartItem) => {
        return cartItem.id !== productId
      })

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount < 1) {
        return
      }

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)

      if(stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      
      const updatedCart = cart.map((cartItem) => {
        if(cartItem.id === productId) {
          return { ...cartItem, amount}
        }
        return cartItem
      })

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
