# 5025251072_Todo-App
Tugas Pemrograman Web materi 5 (Hypertext)

1. Implement menu bar/side bar, have two menu: “Personal” and “Shared”
   
   <img width="1600" height="912" alt="WhatsApp Image 2026-10-18 at 15 50 16" src="https://github.com/user-attachments/assets/29fe8611-2b2f-497b-8ae2-c98fd0570c14" />


2. Migrate the HTML code into PHP and make it modular. For example: menu-bar.php, config.php, content.php, etc.

   <img width="348" height="340" alt="WhatsApp Image 2026-10-18 at 15 53 45" src="https://github.com/user-attachments/assets/b5550740-52e6-43f5-a29b-116e3ff2deff" />

3. Create the database structure with dummy data and save it as a database file data.sql.

   <img width="1078" height="603" alt="Screenshot 2026-10-18 at 15 54 44" src="https://github.com/user-attachments/assets/56100d77-5e63-4127-97eb-e869c283c4fa" />


4. Implement the CRUD of the Todo App using PHP.

  - Menambahkan create (menambah todo-list)  "pribadi" -> sebagai user Amel
    
    **Tampilan Web**
    
    <img width="479" height="836" alt="Screenshot 2026-10-18 at 16 13 16" src="https://github.com/user-attachments/assets/8c68b93a-06c3-4825-bfe1-73dff678ee9f" />

    Keterangan: Terdapat beberapa perubahan fitur dari tugas sebelumnya, yakni penambahan pilihan "prioritas" agar user bisa memilih tingkat urgensi


    <img width="1505" height="873" alt="Screenshot 2026-10-18 at 16 16 16" src="https://github.com/user-attachments/assets/60abb552-73d3-437c-bbee-e2b99ce44020" />


    <img width="378" height="109" alt="Screenshot 2026-10-18 at 16 17 15" src="https://github.com/user-attachments/assets/1d5165c7-d61e-4a44-a29e-b5450e5796ff" />


    **Tampilan phpMyAdmin**


    <img width="1272" height="590" alt="Screenshot 2026-10-18 at 16 21 45" src="https://github.com/user-attachments/assets/93106405-3207-49b1-9c15-ac4771c146e8" />


    Gambar di atas menunjukkan bahwa Web mampu menangkap input user terkait penambahan todo-list dan mampu menyimpan input tersebut ke dalam database.

  - Mengedit todo

    **Tampilan Web**
    
    Di sini, terdapat perubahan di bagian prioritas.
    
    <img width="501" height="824" alt="Screenshot 2026-10-18 at 16 25 47" src="https://github.com/user-attachments/assets/4ba2c40d-1855-47cf-bc20-c3de0d319b88" />


    <img width="970" height="587" alt="Screenshot 2026-10-18 at 16 27 47" src="https://github.com/user-attachments/assets/882b9cfe-cdc9-491c-981b-b790288981e2" />

  
    Dalam gambar tersebut, terlihat juga bahwa kita dapat menghapus gambar yang kita ambil

    **Tampilan phpMyAdmin**

    <img width="1289" height="615" alt="Screenshot 2026-10-18 at 16 28 48" src="https://github.com/user-attachments/assets/ada9d87d-6a01-428c-a79e-97e61bda5a54" />

    Database berhasil diupdate sesuai dengan perubahan yang dilakukan.


  - Menghapus todo

    <img width="1289" height="533" alt="Screenshot 2026-10-18 at 16 31 43" src="https://github.com/user-attachments/assets/88b7605e-9fbd-499d-a6f6-d8d104193c99" />

    Saat menghapus todo dari tampilan web, todo dalam database juga akan terhapus


5. Additionally, you can implement file handling using PHP.

  - Menambahkan foto dalam todo-list
    
   <img width="957" height="600" alt="Screenshot 2026-10-18 at 16 35 47" src="https://github.com/user-attachments/assets/0605b1d3-0fed-4398-8203-0b7831d2a40a" />

  - Foto yang diinput masuk ke dalam folder src
    
  <img width="1095" height="593" alt="Screenshot 2026-10-18 at 16 36 44" src="https://github.com/user-attachments/assets/723c6b51-673f-4b69-b8df-ba457969902f" />

  - Saat todo tersebut dihapus, file foto dalam folder src juga akan terhapus

    <img width="162" height="206" alt="Screenshot 2026-10-18 at 16 39 26" src="https://github.com/user-attachments/assets/7d59c1f7-ed8c-4e19-bd8a-188a792f3407" />


**Tambahan tentang fitur personal dan shared**

- Ketika user memilih "Bagikan ke menu Shared", maka data mengenai todolist tersebut akan ditampilan pada menu `Shared`
  
   <img width="498" height="505" alt="Screenshot 2026-10-18 at 16 44 50" src="https://github.com/user-attachments/assets/12e6c36f-bb82-41f0-9a4b-e9c4856c4861" />

    <img width="1511" height="803" alt="Screenshot 2026-10-18 at 16 46 28" src="https://github.com/user-attachments/assets/c214ff33-1845-4518-bc51-f36aff92134a" />


- Saat user memilih menu `shared` , maka yang akan terlihat di layar adalah todolist yang berisikan data yang dapat diakses oleh seluruh pengguna. Terdapat keterangan mengenai siapa yang membuat todolist tersebut

  <img width="1512" height="982" alt="Screenshot 2026-10-18 at 16 42 45" src="https://github.com/user-attachments/assets/0dcc40e7-ba51-44eb-b446-e89f6e0dfae1" />

- Hanya user pembuat yang mampu melakukan perubahan terhadap list yang ditambahkan.

  <img width="494" height="190" alt="Screenshot 2026-10-18 at 16 47 26" src="https://github.com/user-attachments/assets/761095f1-de9d-4581-8b88-b0d11d07855a" />



   

    



    





