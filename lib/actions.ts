"use server";

import { prisma } from "./db";
import crypto from "crypto";

// 1. Autenticación y Perfil de Usuario
export async function getSessionUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return { success: true, user };
  } catch (error: any) {
    console.error("Error al obtener usuario:", error);
    return { success: false, error: error.message };
  }
}

export async function loginAction(email: string, password?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "El correo electrónico no está registrado." };
    }

    // En una simulación, permitimos login directo
    if (password && user.password && user.password !== password) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Error en loginAction:", error);
    return { success: false, error: error.message };
  }
}

export async function registerAction(data: {
  name: string;
  lastname: string;
  email: string;
  password?: string;
  googleId?: string;
  dni?: string;
  phone?: string;
}) {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { success: false, error: "El correo electrónico ya está registrado." };
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: data.password || null,
        googleId: data.googleId || null,
        dni: data.dni || null,
        phone: data.phone || null,
        purchaseStreak: 80,
        isVerified: true,
      },
    });

    return { success: true, user };
  } catch (error: any) {
    console.error("Error en registerAction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProfileAction(
  userId: number,
  data: {
    name: string;
    lastname: string;
    dni: string;
    phone: string;
    email: string;
  }
) {
  try {
    // Verificar si el email ya existe para otro usuario
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing && existing.id !== userId) {
      return { success: false, error: "El correo electrónico ya está en uso por otro usuario." };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        lastname: data.lastname,
        dni: data.dni,
        phone: data.phone,
        email: data.email,
      },
    });

    return { success: true, user };
  } catch (error: any) {
    console.error("Error en updateProfileAction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLocationAction(
  userId: number,
  address: string,
  lat: number,
  lng: number
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        location: address,
        lat,
        lng,
      },
    });
    return { success: true, user };
  } catch (error: any) {
    console.error("Error en updateLocationAction:", error);
    return { success: false, error: error.message };
  }
}

// 1.5 Recuperación de Contraseña (Resend)
export async function forgotPasswordAction(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "No existe una cuenta con ese correo electrónico." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
    if (!baseUrl && process.env.NODE_ENV === "production") {
      console.error("NEXT_PUBLIC_BASE_URL is not configured — skipping password reset email");
      return { success: false, error: "Configuración de URL base no disponible." };
    }
    const safeBaseUrl = baseUrl || "http://localhost:3000";
    const resetLink = `${safeBaseUrl}/reset-password?token=${resetToken}`;

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (!apiKey || apiKey === "re_xxxxxxxxxxxxx") {
      console.log("============================================");
      console.log("RESEND NO CONFIGURADO — modo simulación");
      console.log(`Para: ${email}`);
      console.log(`Enlace: ${resetLink}`);
      console.log("============================================");
      return {
        success: true,
        message: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
        debugLink: resetLink,
      };
    }

    const { Resend } = require("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Recuperación de contraseña — SmartStock",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; font-size: 20px; margin: 0;">SmartStock</h1>
          </div>
          <div style="background: #fafafa; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px;">Recupera tu contraseña</h2>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en SmartStock.
              Haz clic en el botón de abajo para continuar:
            </p>
            <a href="${resetLink}" style="display: inline-block; background: #7c3aed; color: white; font-weight: bold; font-size: 14px; padding: 12px 32px; border-radius: 12px; text-decoration: none; margin: 16px 0;">
              Restablecer contraseña
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
              Si no solicitaste este cambio, ignora este correo. El enlace expira en 1 hora.
            </p>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
    };
  } catch (error: any) {
    console.error("Error en forgotPasswordAction:", error);
    return { success: false, error: error.message };
  }
}

export async function resetPasswordAction(token: string, newPassword: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return { success: false, error: "El enlace de recuperación es inválido o ha expirado." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true, message: "Contraseña restablecida exitosamente." };
  } catch (error: any) {
    console.error("Error en resetPasswordAction:", error);
    return { success: false, error: error.message };
  }
}

// 2. Tiendas y Productos
export async function getStoresAction() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { rating: "desc" },
    });
    return { success: true, stores };
  } catch (error: any) {
    console.error("Error al obtener tiendas:", error);
    return { success: false, error: error.message, stores: [] };
  }
}

export async function fetchNearbyTambosAction(lat: number, lng: number, radius: number = 3000) {
  try {
    const overpassQuery = `[out:json];
      (
        node["name"~"Tambo"](around:${radius},${lat},${lng});
        way["name"~"Tambo"](around:${radius},${lat},${lng});
      );
      out body;
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: overpassQuery }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn("Overpass API responded with status:", response.status);
      return { success: false, tambos: [], error: "Overpass API error" };
    }

    const data = await response.json();
    const tambos = (data.elements || [])
      .filter((el: any) => el.tags?.name?.toLowerCase().includes("tambo"))
      .map((el: any, index: number) => ({
        id: -(index + 1),
        name: el.tags.name || "Tambo",
        category: el.tags.shop ? "Tienda de conveniencia" : (el.tags.amenity || "Tienda"),
        rating: 4.5,
        deliveryTimeMin: 15,
        deliveryTimeMax: 25,
        distanceKm: 0,
        lat: el.lat || (el.center?.lat || 0),
        lng: el.lon || (el.center?.lon || 0),
        address: [
          el.tags["addr:street"],
          el.tags["addr:housenumber"],
          el.tags["addr:district"],
          el.tags["addr:city"],
        ].filter(Boolean).join(", ") || el.tags.name || "Dirección no disponible",
        isFromOverpass: true,
      }));

    return { success: true, tambos };
  } catch (error: any) {
    console.error("Error fetching Tambos from Overpass:", error);
    return { success: false, tambos: [], error: error.message };
  }
}

export async function googleLoginAction(data: {
  email: string;
  name: string;
  lastname: string;
  googleId: string;
}) {
  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { googleId: data.googleId }] },
    });

    if (existing) {
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: data.googleId,
          name: data.name,
          lastname: data.lastname,
        },
      });
      return { success: true, user };
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        googleId: data.googleId,
        purchaseStreak: 80,
        isVerified: true,
      },
    });
    return { success: true, user };
  } catch (error: any) {
    console.error("Error en googleLoginAction:", error);
    return { success: false, error: error.message };
  }
}

export async function getProductsAction() {
  try {
    const products = await prisma.product.findMany();
    return { success: true, products };
  } catch (error: any) {
    console.error("Error al obtener productos:", error);
    return { success: false, error: error.message, products: [] };
  }
}

export async function getProductsBySubCategoryAction(subCategory: string) {
  try {
    const products = await prisma.product.findMany({
      where: { subCategory },
    });
    return { success: true, products };
  } catch (error: any) {
    console.error("Error al obtener productos por subcategoría:", error);
    return { success: false, error: error.message, products: [] };
  }
}

// 3. Órdenes / Pedidos
export async function createOrderAction(
  userId: number,
  total: number,
  address: string,
  items: Array<{ productId: number; quantity: number; price: number }>
) {
  try {
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return { success: false, error: `Producto ID ${item.productId} no encontrado.` };
      }
      if (product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.` };
      }
    }

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        address,
        status: "Pendiente",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    // Incrementar la racha de compra del usuario (máximo 100)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const newStreak = Math.min(100, user.purchaseStreak + 5);
      await prisma.user.update({
        where: { id: userId },
        data: { purchaseStreak: newStreak },
      });
    }

    return { success: true, order };
  } catch (error: any) {
    console.error("Error al crear orden:", error);
    return { success: false, error: error.message };
  }
}

export async function getComboProductsAction(comboId: number) {
  try {
    const items = await prisma.comboProduct.findMany({
      where: { comboId },
      include: { product: true },
    });
    return {
      success: true,
      items: items.map((i) => ({ product: i.product, quantity: i.quantity })),
    };
  } catch (error: any) {
    console.error("Error al obtener productos del combo:", error);
    return { success: false, items: [], error: error.message };
  }
}

export async function updateAvatarAction(userId: number, avatarUrl: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return { success: true, user };
  } catch (error: any) {
    console.error("Error en updateAvatarAction:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserOrdersAction(userId: number) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, orders };
  } catch (error: any) {
    console.error("Error al obtener órdenes:", error);
    return { success: false, error: error.message, orders: [] };
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar estado de orden:", error);
    return { success: false, error: error.message };
  }
}
