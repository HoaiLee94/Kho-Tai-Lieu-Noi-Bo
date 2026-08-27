using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Hangfire;
using Backend.Hubs;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Database Connection
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure SignalR & Hangfire & Services
builder.Services.AddSignalR();
builder.Services.AddHangfire(config => config.UseInMemoryStorage());
builder.Services.AddHangfireServer();
builder.Services.AddScoped<IEmailService, EmailService>();

// Configure CORS for SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // SignalR needs credentials
        });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "EVNSPC",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "EVNSPC_Users",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "EVNSPC_KhoTaiLieuNghiepVu_SecretKey_2026_VerySecure123!"))
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<Backend.Middlewares.ExceptionMiddleware>();

app.UseHttpsRedirection();

// Enable serving static files (for document uploads)
app.UseStaticFiles();

app.UseCors("AllowNextJs");

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire");

app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

// Bắt đầu khối Seed Data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!context.Users.Any())
    {
        context.Users.Add(new Backend.Models.User
        {
            Username = "admin",
            PasswordHash = "123456", // MVP
            FullName = "Quản trị hệ thống",
            Role = "SystemAdmin"
        });
        context.SaveChanges();
    }
    
    if (!context.Categories.Any())
    {
        context.Categories.Add(new Backend.Models.Category
        {
            Name = "Quy trình chung",
            Description = "Các quy trình, thủ tục nghiệp vụ chung của EVNSPC"
        });
        context.SaveChanges();
    }
}

app.Run();
