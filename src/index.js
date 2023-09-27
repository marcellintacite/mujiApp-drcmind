import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithRedirect,
} from "firebase/auth";
import {
  collectionGroup,
  deleteDoc,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD2mbYGbjafiv5ikZ0Piyk7VSsxKMIsNhs",
  authDomain: "fir-demo-57641.firebaseapp.com",
  projectId: "fir-demo-57641",
  storageBucket: "fir-demo-57641.appspot.com",
  messagingSenderId: "983995023140",
  appId: "1:983995023140:web:e886c7f2b5121bad353db1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

// initialisai=tion db
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Sign in with Google
const signInWithGoogle = () => {
  signInWithRedirect(auth, provider);
};

// Selection des elements dom
const signInBtn = document.querySelector("#googlebtn");
const loginForm = document.querySelector("#login");
const user_email = document.querySelector("#user_email");
const deconnexion = document.querySelector("#deconnexion");
const container = document.querySelector("#container");
const villesList = document.querySelector("#villesList");
const modalAjouter = document.querySelector("#defaultModal");
const boutonAjouter = document.querySelector("#addville");
const close = document.querySelector(".modal-close");
const userPart = document.querySelector("#user");
const boutonClose = document.querySelector("#closeModal");
const imagePreview = document.querySelector("#img-upload");
const imageInput = document.querySelector("#example1");
const submitBtn = document.querySelector("#submit");
const passwordlessForm = document.querySelector(".passwordless");
const ajouterVille = document.querySelector("#ajouterville");

let cityUrlImg = "";

// ref
const citiesRef = collectionGroup(db, "villes");
// Formater la date
const getFormatedDate = (date) => {
  const formatedDate = new Intl.DateTimeFormat("fr").format(
    date ? date.toDate() : new Date()
  );
  return formatedDate;
};

// Tester si on est sur la page detail et recuperer l'id de la ville dans l'url avec l'attribut data
if (
  !window.location.search.replace("?data=", "") ||
  location.href.includes("?apiKey=")
) {
  boutonAjouter.addEventListener("click", toggleModal);
  boutonClose.addEventListener("click", toggleModal);
  boutonAjouter.addEventListener("click", toggleModal);
  container.style.display = "none";
  // Upload image

  loginForm.style.display = "none";
  // Login formulaire
  passwordlessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = passwordlessForm.email.value;
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };
    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSign", email);
        passwordlessForm.reset();
      })
      .catch((err) => {
        console.log(err.message);
      });
  });
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = localStorage.getItem("emailForSign");

    if (!email) {
      email = window.prompt("Veuillez saisir votre adresse mail");
    }

    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        console.log("Connectez-vous avec succès");
        window.localStorage.removeItem("emailForSign");

        // lier
        linkWithRedirect(auth.currentUser, new GoogleAuthProvider());
      })
      .catch((err) => {
        console.log(err.message);
      });
  }
  // Ajouter une ville
  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.style.width = "70%";
    };
    reader.readAsDataURL(file);
    submitBtn.disabled = true;
    try {
      if (cityUrlImg) await deleteImgToStorage();
      cityUrlImg = await uploadToStorageImage(file);
      submitBtn.disabled = false;
      console.log(cityUrlImg);
    } catch (error) {
      console.log(error.message);
    }
  });

  // Formulaire
  ajouterVille.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Création de l'id en effacant les espaces et en mettant en minuscule
    const newDocID = String(ajouterVille.ville.value)
      .toLocaleLowerCase()
      .replace(/\s+/g, "");
    const user = auth.currentUser;
    const usersCityRef = `utilisateurs/${user.uid}/villes`;
    const userCityDocRef = doc(db, usersCityRef, newDocID);

    const pays = ajouterVille.pays.value;
    const ville = ajouterVille.ville.value;
    const population = Number(ajouterVille.population.value);
    const capital = ajouterVille.capitale.value === "oui" ? true : false;

    setDoc(userCityDocRef, {
      cityID: newDocID,
      pays,
      ville,
      population,
      capital,
      dateDajout: serverTimestamp(),
      cityUrlImg,
      user: {
        email: user.email,
        uid: user.uid,
      },
    });
    ajouterVille.reset();
    toggleModal();
  });

  // Event
  signInBtn.addEventListener("click", signInWithGoogle);

  // Auth state change
  // Auth state change

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginForm.style.display = "none";
      user_email.textContent = user.email;
      container.style.display = "";
      userPart.style.display = "flex";
    } else {
      loginForm.style.display = "";
      container.style.display = "none";
      userPart.style.display = "none";
    }
  });
  // Deconnexion
  deconnexion.addEventListener("click", () => {
    signOut(auth);
  });
  //
  close.addEventListener("click", () => {
    toggleModal();
  });
} else {
  const cityID = window.location.search.replace("?data=", "");
  const queryDoc = query(citiesRef, where("cityID", "==", cityID));

  onSnapshot(queryDoc, (snapshot) => {
    const villes = snapshot.docs.map((d) => d.data());
    const cityItemContainer = document.querySelector("#town");
    console.log(villes[0]);

    cityItemContainer.innerHTML = `
    <a href="${villes[0].cityUrlImg}">
    <img src="${villes[0].cityUrlImg}" alt="" class="rounded-md" /></a>
        <h1 class="mt-2 text-2xl font-bold">${villes[0].ville}</h1>
        <h4 class="city-country">${
          villes[0].capital === true ? "La capitale de " : "Pays: "
        } ${villes[0].pays}</h4>
        <p class="city-population">Poupulation: ${villes[0].population}</p>
        <p class="city-publisher">Postée par ${
          villes[0].user?.uid === auth.currentUser.uid
            ? "vous"
            : villes[0].user?.email
        }
        </p>
        <p class="city-population">Ajoutée le: ${getFormatedDate(
          villes[0].dateDajout
        )}
        </p>
        <button class="bg-red-100 p-3 mt-3 rounded-lg" id="remove">
          <span class="mdc-button__label">Supprimer cette ville</span>
        <button/>
       `;

    const removeBtn = document.querySelector("#remove");
    const estProprietaire = villes[0].user?.uid === auth.currentUser.uid;

    removeBtn.style.display = estProprietaire ? "block" : "none";
    removeBtn.addEventListener("click", () => {
      deleteDoc(doc(db, `utilisateurs/${auth.currentUser.uid}/villes`, cityID));
      window.localStorage.setItem("cityID", cityID);
      location.assign(`${location.origin}/dist/index.html`);
    });

    const modifierForm = document.querySelector("#modifierVille");
    if (!estProprietaire) modifierForm.style.display = "none";
    const imagePreview = document.querySelector("#img-upload");
    const inputImage = document.querySelector("#example1");
    let cityUrlImg = villes[0].cityUrlImg;
    modifierForm.ville.value = villes[0].ville;
    modifierForm.pays.value = villes[0].pays;
    modifierForm.population.value = villes[0].population;
    modifierForm.capitale.value = villes[0].capital === true ? "oui" : "non";
    document.querySelector("#edit").style.display = estProprietaire
      ? ""
      : "none";
    inputImage.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        imagePreview.src = reader.result;
        imagePreview.style.width = "70%";
      };
      reader.readAsDataURL(file);
      submitBtn.disabled = true;
      try {
        // if (cityUrlImg) await deleteImgToStorage();
        cityUrlImg = await uploadToStorageImage(file);
        submitBtn.disabled = false;
      } catch (error) {
        console.log(error.message);
      }
    });

    modifierForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pays = modifierForm.pays.value;
      const ville = modifierForm.ville.value;
      const population = Number(modifierForm.population.value);
      const capital = modifierForm.capitale.value === "oui" ? true : false;
      const user = auth.currentUser;
      const usersCityRef = `utilisateurs/${user.uid}/villes`;
      const userCityDocRef = doc(db, usersCityRef, cityID);
      setDoc(
        userCityDocRef,
        {
          cityID,
          pays,
          ville,
          population,
          capital,
          dateDajout: serverTimestamp(),
          cityUrlImg,
          user: {
            email: user.email,
            uid: user.uid,
          },
        },
        { merge: true }
      );

      modifierForm.reset();
      location.reload();
    });
  });
}

function toggleModal() {
  const body = document.querySelector("body");
  const modal = document.querySelector(".modal");
  modal.classList.toggle("opacity-0");
  modal.classList.toggle("pointer-events-none");
  body.classList.toggle("modal-active");
}

// Fonction pour uploader sur storage
const uploadToStorageImage = async (file) => {
  const filePath = `images/${Date.now()}`;
  const pathReference = ref(storage, filePath);
  const uploadTask = await uploadBytes(pathReference, file);
  window.localStorage.setItem("pathReference", uploadTask.ref.fullPath);

  return await getDownloadURL(uploadTask.ref);
};

// Suppresion de l'image
const deleteImgToStorage = async () => {
  const pathReference = window.localStorage.getItem("pathReference");
  const imgRef = ref(storage, pathReference);
  // window.localStorage.removeItem("pathReference");
  return await deleteObject(imgRef);
};

// Getting towns data
let villes = [];

onSnapshot(citiesRef, (snapshot) => {
  villes = snapshot.docs.map((doc) => doc.data());
  let cities = "";
  villes.forEach((ville) => {
    cities += `<a class="w-[350px] hover:scale-[1.04] transition-all border-2 border-gray-100 rounded-md p-2" href="detail.html?data=${
      ville.cityID
    }" style="opacity: ${ville.isOffLine === true ? "0.5" : "1"}">
      
  <img src="${ville.cityUrlImg}" alt="" class="rounded-md" />
 

      <h1 class="mt-2 font-bold text-2xl">${ville.ville}</h1>
            <h4 class="city-country">${
              ville.capital === true ? "La capitale de " : "Pays: "
            } ${ville.pays}</h4>
            <p class="city-population">Population: ${ville.population}</p>
            <p class="city-publisher">Postée par ${
              ville.user?.uid === auth.currentUser.uid
                ? "vous"
                : ville.user?.email
            }
            </p>
            <p class="city-population">Ajoutée le : ${getFormatedDate(
              ville.dateDajout
            )}</p>
            
      </a>`;
  });

  villesList.innerHTML = cities;
});
